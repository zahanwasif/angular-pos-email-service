import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';
import { Timestamp } from '@google-cloud/firestore';

@Injectable()
export class Firebase {
  constructor(@Inject('FIREBASE_APP') private readonly app: app.App) {}

  async getQueryWithinRange(
    startDate: Date | Timestamp,
    endDate: Date | Timestamp,
    collectionName: string,
    dateField: string = 'created_at'
  ) {
    const db = this.app.firestore();
    const snapshot = await db
      .collection(collectionName)
      .where(dateField, '>=', startDate)
      .where(dateField, '<=', endDate)
      .get();

    return snapshot.docs.map((doc) => doc.data());
  }

  async getExpensesWithinRange(startDate: Timestamp, endDate: Timestamp) {
    return this.getQueryWithinRange(startDate, endDate, 'expenses','date');
  }

  async getFactoryTransactionsWithinRange(startDate: Date, endDate: Date) {
    return this.getQueryWithinRange(startDate, endDate, 'factory_transactions');
  }

  async getPurchaseOrdersWithinRange(startDate: Timestamp, endDate: Timestamp) {
    const purchaseOrders = await this.getQueryWithinRange(
      startDate,
      endDate,
      'purchase_orders',
      'date'
    );

    // to vendor name
    const posHash = {}
    purchaseOrders.map((po) => {
      posHash[po.id] = po.vendorName
    });

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
        .collection('order_lines')
        .where('purchase_order_id', 'in', chunk)
        .get();
    });

    const snapshots = (await Promise.all(promises))
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()))
      .flat();

    snapshots.map((snapshot) => {
      snapshot.vendorName = posHash[snapshot.purchase_order_id];
    });

    const pos = {};
    snapshots.forEach((snapshot) => {
      if (!pos[snapshot.vendorName]) {
        pos[snapshot.vendorName] = [];
      }
      pos[snapshot.vendorName].push(snapshot);
    });

    const posArray = Object.entries(pos).map((entry: any) => {
      return {
        name: entry[0],
        orderlines: Object.values(entry)[1],
      };
    });
    return posArray;
  }

  async getSalesWithinRange(startDate: Timestamp, endDate: Timestamp) {
    return this.getQueryWithinRange(startDate, endDate, 'sales');
  }

  async getTransactionsWithinRange(startDate: Timestamp, endDate: Timestamp) {
    const transactions = await this.getQueryWithinRange(
      startDate,
      endDate,
      'transactions',
      'date'
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

  timestampToDateString(timestamp: Timestamp) {
    const date = timestamp.toDate();
    return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${(
      "0" + date.getDate()
    ).slice(-2)}`;
  }
}
