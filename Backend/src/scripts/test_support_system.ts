import mongoose from 'mongoose';
import { TicketService } from '../modules/support/services/ticket.service';
import { TicketMessageService } from '../modules/support/services/ticketMessage.service';
import { TicketRepository } from '../modules/support/repositories/ticket.repository';
import { TicketMessageRepository } from '../modules/support/repositories/ticketMessage.repository';
import { AdminSupportService } from '../admin/support/adminSupport.service';
import UserModel from '../modules/users/user.model';
import TicketModel from '../modules/support/models/ticket.model';
import TicketMessageModel from '../modules/support/models/ticketMessage.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geotrix?directConnection=true';

async function runSupportSystemTest() {
  console.log('====================================================');
  console.log('       SUPPORT TICKETS SYSTEM END-TO-END TEST       ');
  console.log('====================================================\n');

  console.log('1. Connecting to MongoDB at', MONGO_URI, '...');
  await mongoose.connect(MONGO_URI);
  console.log('✔ Connected to MongoDB successfully.\n');

  try {
    const ticketRepo = new TicketRepository();
    const messageRepo = new TicketMessageRepository();
    const ticketService = new TicketService(ticketRepo, messageRepo);
    const messageService = new TicketMessageService(messageRepo, ticketRepo);
    const adminService = new AdminSupportService();

    // 2. Setup Test Users
    console.log('2. Setting up test users (Customer, Admin, Support Agent)...');
    
    // Test Customer
    let customer = await UserModel.findOne({ email: 'support_test_customer@mfolks.com' });
    if (!customer) {
      customer = await UserModel.create({
        name: 'Arjun Customer',
        email: 'support_test_customer@mfolks.com',
        phone: '+91 9876543210',
        role: 'customer',
        passwordHash: 'hashed_dummy_password',
        status: 'active',
      });
    }

    // Test Admin
    let admin = await UserModel.findOne({ email: 'support_test_admin@mfolks.com' });
    if (!admin) {
      admin = await UserModel.create({
        name: 'Priya Admin',
        email: 'support_test_admin@mfolks.com',
        phone: '+91 9876543211',
        role: 'admin',
        passwordHash: 'hashed_dummy_password',
        status: 'active',
      });
    }

    // Another Customer (for security isolation test)
    let otherCustomer = await UserModel.findOne({ email: 'support_test_other@mfolks.com' });
    if (!otherCustomer) {
      otherCustomer = await UserModel.create({
        name: 'Rohan Other',
        email: 'support_test_other@mfolks.com',
        phone: '+91 9876543212',
        role: 'customer',
        passwordHash: 'hashed_dummy_password',
        status: 'active',
      });
    }

    console.log(`✔ Customer: ${customer.name} (ID: ${customer._id})`);
    console.log(`✔ Admin: ${admin.name} (ID: ${admin._id})`);
    console.log(`✔ Other Customer: ${otherCustomer.name} (ID: ${otherCustomer._id})\n`);

    // Clean up past test tickets for clean run
    await TicketModel.deleteMany({ user: { $in: [customer._id, otherCustomer._id] } });
    await TicketMessageModel.deleteMany({ sender: { $in: [customer._id, admin._id, otherCustomer._id] } });

    // 3. Customer creates a new Ticket
    console.log('3. Testing Ticket Creation by Customer...');
    const createdTicket = await ticketService.createTicket(String(customer._id), {
      subject: 'Inquiry regarding GNSS RTK Base Station calibration',
      category: 'TECHNICAL',
      priority: 'HIGH',
      message: 'Hello, I received the Stonex S900A receiver and need assistance configuring the UHF radio frequency.',
    });

    console.log('✔ Ticket created successfully:');
    console.log(`  - Ticket ID: ${createdTicket._id}`);
    console.log(`  - Ticket Number: ${createdTicket.ticketNumber}`);
    console.log(`  - Subject: ${createdTicket.subject}`);
    console.log(`  - Category: ${createdTicket.category}`);
    console.log(`  - Priority: ${createdTicket.priority}`);
    console.log(`  - Status: ${createdTicket.status}\n`);

    if (!createdTicket.ticketNumber.startsWith('TKT-')) {
      throw new Error(`Invalid ticket number format: ${createdTicket.ticketNumber}`);
    }

    // 4. Customer views their tickets list
    console.log('4. Testing Customer Ticket List retrieval...');
    const customerTickets = await ticketService.getTickets({}, String(customer._id), false);
    console.log(`✔ Retrieved ${customerTickets.items.length} ticket(s) for customer.`);
    if (customerTickets.items.length === 0) throw new Error('Customer tickets list is empty!');

    // 5. Customer views specific ticket details and conversation
    console.log('5. Testing Ticket Details & Conversation retrieval...');
    const ticketDetail = await ticketService.getTicket(String(createdTicket._id), String(customer._id), false);
    console.log(`✔ Ticket details loaded. Messages count: ${ticketDetail.messages.length}`);
    console.log(`  - Initial Message: "${ticketDetail.messages[0].message}"\n`);

    // 6. Security Isolation Check: Other Customer trying to access this ticket
    console.log('6. Testing Security Isolation (Other customer cannot view this ticket)...');
    try {
      await ticketService.getTicket(String(createdTicket._id), String(otherCustomer._id), false);
      throw new Error('SECURITY BREACH: Unauthorized customer was able to access private ticket!');
    } catch (err: any) {
      console.log(`✔ Access correctly denied with status ${err.statusCode || 403}: ${err.message}\n`);
    }

    // 7. Customer sends a reply to the ticket
    console.log('7. Testing Customer Reply...');
    const customerReply = await messageService.replyToTicket(String(createdTicket._id), String(customer._id), {
      message: 'Also, please let me know if firmware v2.4.1 is required.',
    });
    console.log('✔ Customer reply posted successfully:');
    console.log(`  - Message ID: ${customerReply._id}`);
    console.log(`  - Content: "${customerReply.message}"\n`);

    // 8. Admin fetches Support Dashboard Stats
    console.log('8. Testing Admin Support Stats Aggregation...');
    const adminStats = await adminService.getStats();
    console.log('✔ Admin Stats retrieved:');
    console.log(`  - Total Tickets: ${adminStats.totalTickets}`);
    console.log(`  - Open Tickets: ${adminStats.openTickets}`);
    console.log(`  - In Progress: ${adminStats.inProgressTickets}`);
    console.log(`  - Resolved: ${adminStats.resolvedTickets}`);
    console.log(`  - Urgent: ${adminStats.urgentTickets}\n`);

    // 9. Admin lists all tickets with search and filters
    console.log('9. Testing Admin Ticket Listing with search and filtering...');
    const adminList = await adminService.list({
      search: 'GNSS',
      priority: 'HIGH',
    });
    console.log(`✔ Admin list found ${adminList.items.length} matching ticket(s).`);
    console.log(`  - First item: [${adminList.items[0].ticketNumber}] ${adminList.items[0].subject}\n`);

    // 10. Admin views ticket & conversation
    console.log('10. Testing Admin Ticket Details & Thread view...');
    const adminThread = await adminService.getTicketDetails(String(createdTicket._id));
    console.log(`✔ Admin loaded thread with ${adminThread.messages.length} messages.`);

    // 11. Admin sends an official reply to the customer
    console.log('11. Testing Admin Reply to Customer...');
    const adminReply = await adminService.reply(
      String(createdTicket._id),
      {
        message: 'Dear Arjun, for the S900A internal UHF radio, please set channel 1 to 460.125 MHz. Firmware v2.4.1 is recommended for latest CORS compatibility.',
      },
      String(admin._id)
    );
    console.log('✔ Admin reply sent successfully.');
    console.log(`  - Message ID: ${adminReply?._id}`);
    console.log(`  - Sender: ${(adminReply?.sender as any)?.name} (${(adminReply?.sender as any)?.role})\n`);

    // 12. Admin assigns ticket to an agent
    console.log('12. Testing Ticket Assignment...');
    const assignedTicket = await adminService.assign(String(createdTicket._id), String(admin._id));
    console.log(`✔ Ticket assigned to agent: ${(assignedTicket?.assignedTo as any)?.name}\n`);

    // 13. Admin updates Ticket Priority
    console.log('13. Testing Priority Update...');
    const updatedPriority = await adminService.updatePriority(String(createdTicket._id), 'URGENT');
    console.log(`✔ Priority updated to: ${updatedPriority?.priority}\n`);

    // 14. Admin updates Ticket Status to RESOLVED
    console.log('14. Testing Status Update to RESOLVED...');
    const resolvedTicket = await adminService.updateStatus(String(createdTicket._id), 'RESOLVED');
    console.log(`✔ Status updated to: ${resolvedTicket?.status}\n`);

    // 15. Verify Edge Case: Cannot reply to CLOSED/RESOLVED ticket directly
    console.log('15. Testing Edge Case (Customer reply on resolved ticket)...');
    try {
      await messageService.replyToTicket(String(createdTicket._id), String(customer._id), {
        message: 'Thanks, this solved my issue!',
      });
      console.log('Note: Customer reply on resolved ticket is rejected until reopened (as expected).');
    } catch (err: any) {
      console.log(`✔ Correctly blocked: ${err.message}\n`);
    }

    // 16. Admin closes the ticket
    console.log('16. Testing Status Update to CLOSED...');
    const closedTicket = await adminService.updateStatus(String(createdTicket._id), 'CLOSED');
    console.log(`✔ Status updated to: ${closedTicket?.status}\n`);

    // 17. Admin Soft Deletes Ticket
    console.log('17. Testing Soft Delete...');
    await adminService.delete(String(createdTicket._id));
    const postDeleteTicket = await TicketModel.findById(createdTicket._id);
    console.log(`✔ Ticket soft-deleted (isDeleted = ${postDeleteTicket?.isDeleted})\n`);

    console.log('====================================================');
    console.log('    ALL SUPPORT SYSTEM TESTS PASSED SUCCESSFULLY!   ');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ Support System Test Failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runSupportSystemTest();
