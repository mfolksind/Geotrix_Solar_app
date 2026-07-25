import { GeotrixBillRepository } from '../../modules/geotrixBills/repositories/geotrixBill.repository';
import { GeotrixBillService } from '../../modules/geotrixBills/services/geotrixBill.service';

export class AdminGeotrixBillService {
  private repo = new GeotrixBillRepository();
  private service = new GeotrixBillService(this.repo);

  public async list(query: Record<string, unknown>) {
    return this.service.getBills(query as any);
  }

  public async get(id: string) {
    return this.service.getBill(id);
  }

  public async updateStatus(id: string, payload: any, userId: string) {
    return this.service.updateStatus(id, payload, userId);
  }

  public async approve(id: string, remarks: string | undefined, userId: string) {
    return this.service.approveBill(id, remarks, userId);
  }

  public async reject(id: string, remarks: string | undefined, userId: string) {
    return this.service.rejectBill(id, remarks, userId);
  }
}
