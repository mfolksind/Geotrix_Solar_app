import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { createTicketSchema, replySchema, updateStatusSchema, assignSchema, idParamSchema } from '../validations/ticket.validation';
import { TicketRepository } from '../repositories/ticket.repository';
import { TicketMessageRepository } from '../repositories/ticketMessage.repository';
import { TicketService } from '../services/ticket.service';
import { TicketMessageService } from '../services/ticketMessage.service';
import { TicketController } from '../controllers/ticket.controller';
import { TicketMessageController } from '../controllers/ticketMessage.controller';
import { authenticate } from '../../auth/auth.middleware';
import multer from 'multer';

const upload = multer();

const router = Router();
const ticketRepo = new TicketRepository();
const messageRepo = new TicketMessageRepository();
const ticketService = new TicketService(ticketRepo, messageRepo);
const messageService = new TicketMessageService(messageRepo, ticketRepo);
const ticketController = new TicketController(ticketService);
const messageController = new TicketMessageController(messageService);

router.post('/tickets', authenticate, validate(createTicketSchema), ticketController.createTicket);
router.get('/tickets', authenticate, ticketController.getTickets);
router.get('/tickets/:id', authenticate, validate(idParamSchema, 'params'), ticketController.getTicket);
router.post('/tickets/:id/reply', authenticate, validate(replySchema), upload.array('attachments'), messageController.replyToTicket);
router.patch('/tickets/:id/status', authenticate, validate(idParamSchema, 'params'), validate(updateStatusSchema), ticketController.updateStatus);
router.patch('/tickets/:id/assign', authenticate, validate(idParamSchema, 'params'), validate(assignSchema), ticketController.assignTicket);

export default router;
