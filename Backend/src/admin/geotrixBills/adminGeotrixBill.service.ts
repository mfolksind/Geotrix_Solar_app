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

}
