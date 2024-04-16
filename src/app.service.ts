import { Injectable } from '@nestjs/common';
import { Email } from './email/email';
import { Firebase } from './firebase/firebase';
import { createPdf } from '@saemhco/nestjs-html-pdf';
import * as path from 'path';
import * as fs from 'fs';
import { Timestamp } from '@google-cloud/firestore';

@Injectable()
export class AppService {
  constructor(
    private readonly emailService: Email,
    private readonly firebaseService: Firebase,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createPDF(startDate: Timestamp, endDate: Timestamp) {
    const expenses = await this.firebaseService.getExpensesWithinRange(
      startDate,
      endDate,
    );

    const products = await this.firebaseService.getAllProducts();
    const productsHash = {};
    products.forEach((product: any) => {
      productsHash[product.id] = product.name;
    });

    let expenseSum = 0;
    expenses.forEach((record: any) => {
      expenseSum += record.amount;
    });
    const sales = await this.firebaseService.getSalesWithinRange(
      startDate,
      endDate,
    );

    var productSales = {};
    sales.forEach((record: any) => {
      JSON.parse(record.carts).forEach((item: any) => {
        let productId = item.id;

        if (!productSales[productId]) {
          productSales[productId] = {
            name: productsHash[productId],
            quantitySold: item.cartQuantity,
            salesAmount: item.finalPrice * parseInt(item.cartQuantity),
            buyingCost: item.unit_price * parseInt(item.cartQuantity),
            grossProfit:
              item.finalPrice * parseInt(item.cartQuantity) -
              item.unit_price * parseInt(item.cartQuantity),
          };
        } else {
          productSales[productId].quantitySold += item.cartQuantity;

          productSales[productId].buyingCost +=
            item.unit_price * parseInt(item.cartQuantity);

          productSales[productId].grossProfit +=
            item.finalPrice * parseInt(item.cartQuantity) -
            item.unit_price * parseInt(item.cartQuantity);

          productSales[productId].salesAmount +=
            item.finalPrice * parseInt(item.cartQuantity);
        }
      });
    });

    const productSalesArray = Object.values(productSales);
    // add average sales
    productSalesArray.forEach((product: any, index: number) => {
      const salesAverage = product.salesAmount / product.quantitySold;
      productSalesArray[index]['salesAverage'] = salesAverage.toFixed(2);

      const buyingSalesAvg = product.buyingCost / product.quantitySold;
      productSalesArray[index]['buyingSalesAvg'] = buyingSalesAvg.toFixed(2);

      const grossProfitPercentage =
        (product.grossProfit / product.salesAmount) * 100;

      productSalesArray[index]['grossProfitPercentage'] =
        grossProfitPercentage.toFixed(2).toString() + '%';
    });

    const pos = await this.firebaseService.getPurchaseOrdersWithinRange(
      startDate,
      endDate,
    );
    pos.forEach((po: any) => {
      po?.orderlines.forEach((ol) => {
        ol.name = productsHash[ol.product_id];
      });
    });

    const productAggregates = {
      quantitySold: 0,
      salesAmount: 0,
      buyingCost: 0,
      grossProfit: 0,
    };

    productSalesArray.forEach((product: any) => {
      productAggregates.quantitySold += product.quantitySold;
      productAggregates.salesAmount += product.salesAmount;
      productAggregates.buyingCost += product.buyingCost;
      productAggregates.grossProfit += product.grossProfit;
    });

    const transactions = await this.firebaseService.getTransactionsWithinRange(
      startDate,
      endDate,
    );
    var customerTransactionSum = 0;
    transactions.forEach((transaction: any) => {
      if (transaction.type == 'credit') {
        customerTransactionSum += parseInt(transaction.amount);
      } else {
        customerTransactionSum -= parseInt(transaction.amount);
      }
    });

    const data = {
      expenses: expenses,
      expenseSum: expenseSum,
      sales: productSalesArray,
      productAggregates: productAggregates,
      inventory: products,
      pos: pos,
      customerTransactions: transactions,
      customerTransactionSum: customerTransactionSum,
    };
    const options = {
      format: 'A4',
      displayHeaderFooter: true,
      margin: {
        left: '10mm',
        top: '25mm',
        right: '10mm',
        bottom: '15mm',
      },
      // headerTemplate: `<div style="width: 100%; text-align: center;"><span style="font-size: 20px;">Muzaffar & Sons By New Lucky Traders</span></div>`,
      footerTemplate: `<div style="width: 100%; text-align: center; font-size: 10px;">From ${this.firebaseService.timestampToDateString(startDate)} till ${this.firebaseService.timestampToDateString(endDate)}</div>`,
      landscape: true,
    };
    const filePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'pdf-invoice.hbs',
    );

    return await createPdf(filePath, options, data);
  }

  async getSummary(startDate: Timestamp, endDate: Timestamp, email: string) {
    const buffer = await this.createPDF(startDate, endDate);
    const subject = `Report From ${this.firebaseService.timestampToDateString(startDate)} till ${this.firebaseService.timestampToDateString(endDate)}`;
    return await this.emailService.sendEmail(buffer, email, subject);
  }
}
