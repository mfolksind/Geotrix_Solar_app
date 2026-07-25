import { TicketRepository } from '../../modules/support/repositories/ticket.repository';
import { TicketService } from '../../modules/support/services/ticket.service';
import { TicketMessageRepository } from '../../modules/support/repositories/ticketMessage.repository';
import { TicketMessageService } from '../../modules/support/services/ticketMessage.service';

export class AdminSupportService {
  private ticketRepo = new TicketRepository();
  private ticketMsgRepo = new TicketMessageRepository();
  private service = new TicketService(this.ticketRepo, this.ticketMsgRepo);
  private msgService = new TicketMessageService(this.ticketMsgRepo, this.ticketRepo);

  public async list(query: Record<string, unknown>) {
    return this.ticketRepo.findAll?.(query as any) ?? [];
  }

  public async get(id: string) {
    return this.ticketRepo.findById(id);
  }

  public async updateStatus(id: string, status: string) {
    return this.service.updateStatus(id, { status } as any, 'SYSTEM');
  }

  public async reply(id: string, payload: any, userId: string) {
    return this.msgService.replyToTicket(id, userId, payload as { message: string; attachments?: Express.Multer.File[]; isInternalNote?: boolean });
  }

  public async assign(id: string, agentId: string) {
    return this.ticketRepo.assignAgent?.(id, agentId) ?? null;
  }
}
