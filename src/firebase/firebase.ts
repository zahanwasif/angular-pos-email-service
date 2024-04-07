import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';

@Injectable()
export class Firebase {
  constructor(@Inject('FIREBASE_APP') private readonly app: app.App) {}

  async getQueryWithinRange(
    startDate: Date,
    endDate: Date,
    collectionName: string,
  ) {
    const db = this.app.firestore();
    const snapshot = await db
      .collection(collectionName)
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .get();

    return snapshot.docs.map((doc) => doc.data());
  }

  async getExpensesWithinRange(startDate: Date, endDate: Date) {
    return this.getQueryWithinRange(startDate, endDate, 'expenses');
  }

  async getFactoryTransactionsWithinRange(startDate: Date, endDate: Date) {
    return this.getQueryWithinRange(startDate, endDate, 'factory_transactions');
  }

  async getPurchaseOrdersWithinRange(startDate: Date, endDate: Date) {
    const purchaseOrders = await this.getQueryWithinRange(
      startDate,
      endDate,
      'purchase_orders',
    );

    const purchaseOrderIds = purchaseOrders.map((po) => po.id);

    const chunkSize = 30;
    const chunks = [];
    for (let i = 0; i < purchaseOrderIds.length; i += chunkSize) {
      chunks.push(purchaseOrderIds.slice(i, i + chunkSize));
    }

    if (chunks.length === 0) {
      return [];
    }

    const promises = chunks.map((chunk) => {
      return this.app
        .firestore()
        .collection('order-lines')
        .where('purchase_order_id', 'in', chunk)
        .get();
    });

    const snapshots = (await Promise.all(promises))
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()))
      .flat();

    return snapshots;
  }

  async getSalesWithinRange(startDate: Date, endDate: Date) {
    return this.getQueryWithinRange(startDate, endDate, 'sales');
  }

  async getTransactionsWithinRange(startDate: Date, endDate: Date) {
    const transactions = await this.getQueryWithinRange(
      startDate,
      endDate,
      'transactions',
    );

    return Promise.all(
      transactions.map(async (transaction) => {
        const customer = await this.app
          .firestore()
          .collection('customers')
          .doc(transaction.customer_id)
          .get();

        return {
          ...transaction,
          customer: customer.data(),
        };
      }),
    );
  }

  async getAllProducts() {
    const snapshot = await this.app.firestore().collection('products').get();
    return snapshot.docs.map((doc) => doc.data());
  }
}
