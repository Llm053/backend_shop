const ExcelJS = require('exceljs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = require('docx');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ExportService {
  
  // Exporter les mouvements de stock en Excel
  static async exportStockMovementsToExcel(movements, filename = 'mouvements_stock.xlsx') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Mouvements de Stock');

      // Configuration des colonnes
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Produit', key: 'product_name', width: 25 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Quantité', key: 'quantity', width: 15 },
        { header: 'Prix Unitaire', key: 'unit_price', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Date', key: 'created_at', width: 20 },
        { header: 'Utilisateur', key: 'username', width: 20 }
      ];

      // Style de l'en-tête
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };

      // Ajouter les données
      movements.forEach(movement => {
        worksheet.addRow({
          id: movement.id,
          product_name: movement.product_name,
          type: movement.type === 'in' ? 'Entrée' : 'Sortie',
          quantity: movement.quantity,
          unit_price: movement.product_price || 0,
          total: movement.quantity * (movement.product_price || 0),
          created_at: new Date(movement.created_at).toLocaleDateString('fr-FR'),
          username: movement.user_name
        });
      });

      // Auto-fit des colonnes
      worksheet.columns.forEach(column => {
        column.width = Math.max(column.width, 15);
      });

      // Ajouter des totaux
      const totalRow = movements.length + 3;
      worksheet.getCell(`D${totalRow}`).value = 'TOTAL:';
      worksheet.getCell(`D${totalRow}`).font = { bold: true };
      
      const totalQuantity = movements.reduce((sum, m) => sum + m.quantity, 0);
      const totalValue = movements.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
      
      worksheet.getCell(`E${totalRow}`).value = totalQuantity;
      worksheet.getCell(`G${totalRow}`).value = totalValue;
      worksheet.getCell(`G${totalRow}`).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      return { buffer, filename };
    } catch (error) {
      console.error('Erreur export Excel:', error);
      throw error;
    }
  }

  // Exporter l'état des stocks en Excel
  static async exportStockStatusToExcel(products, filename = 'etat_stock.xlsx') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('État des Stocks');

      // Configuration des colonnes
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Produit', key: 'name', width: 30 },
        { header: 'Catégorie', key: 'category_name', width: 20 },
        { header: 'Prix', key: 'price', width: 15 },
        { header: 'Stock Actuel', key: 'stock_quantity', width: 15 },
        { header: 'Stock Minimum', key: 'min_stock', width: 15 },
        { header: 'Statut', key: 'status', width: 15 },
        { header: 'Valeur Stock', key: 'stock_value', width: 15 }
      ];

      // Style de l'en-tête
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };

      // Ajouter les données
      products.forEach(product => {
        const status = product.stock_quantity <= product.min_stock ? '⚠️ Rupture' : '✅ OK';
        const stockValue = product.stock_quantity * product.price;
        
        worksheet.addRow({
          id: product.id,
          name: product.name,
          category_name: product.category_name,
          price: product.price,
          stock_quantity: product.stock_quantity,
          min_stock: product.min_stock,
          status: status,
          stock_value: stockValue
        });
      });

      // Auto-fit des colonnes
      worksheet.columns.forEach(column => {
        column.width = Math.max(column.width, 15);
      });

      // Ajouter des totaux
      const totalRow = products.length + 3;
      worksheet.getCell(`D${totalRow}`).value = 'TOTAL:';
      worksheet.getCell(`D${totalRow}`).font = { bold: true };
      
      const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0);
      worksheet.getCell(`H${totalRow}`).value = totalValue;
      worksheet.getCell(`H${totalRow}`).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      return { buffer, filename };
    } catch (error) {
      console.error('Erreur export Excel:', error);
      throw error;
    }
  }

  // Exporter en Word
  static async exportToWord(data, type, filename = 'rapport.docx') {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Rapport ${type}`,
                  bold: true,
                  size: 32
                })
              ],
              alignment: 'center'
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
                  size: 20
                })
              ],
              alignment: 'center'
            }),
            new Paragraph({ text: '' }), // Espacement
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              },
              rows: data.map(item => 
                new TableRow({
                  children: Object.values(item).map(value => 
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: String(value) })]
                      })]
                    })
                  )
                })
              )
            })
          ]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      return { buffer, filename };
    } catch (error) {
      console.error('Erreur export Word:', error);
      throw error;
    }
  }

  // Exporter en PDF
  static async exportToPDF(htmlContent, filename = 'rapport.pdf') {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await browser.close();
      return { buffer: pdfBuffer, filename };
    } catch (error) {
      console.error('Erreur export PDF:', error);
      throw error;
    }
  }

  // Générer le HTML pour les rapports PDF
  static generateStockReportHTML(data, type) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport ${type}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #4F46E5; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #4F46E5; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Rapport ${type}</h1>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => 
              `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Stock Management System - Rapport généré automatiquement</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = ExportService;
