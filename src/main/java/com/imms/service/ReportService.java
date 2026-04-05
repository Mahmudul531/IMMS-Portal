package com.imms.service;

import com.imms.model.entity.AssetTransferLog;
import com.imms.repository.AssetTransferLogRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private AssetTransferLogRepository transferLogRepository;

    public ByteArrayInputStream generateTransferPdf(Long propertyId) {
        List<AssetTransferLog> logs = getLogs(propertyId);
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
            fontHeader.setSize(18);

            Paragraph title = new Paragraph("Asset Transfer Activity Report", fontHeader);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3, 3, 3, 3, 2, 4});

            String[] headers = {"Date", "Asset", "From", "To", "By", "Note"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            for (AssetTransferLog log : logs) {
                table.addCell(log.getTransferDate().toString());
                table.addCell(log.getAssetName());
                table.addCell(log.getFromPropertyName());
                table.addCell(log.getToPropertyName());
                table.addCell(log.getTransferredBy());
                table.addCell(log.getTransferNote() != null ? log.getTransferNote() : "-");
            }

            document.add(table);
            document.close();

        } catch (DocumentException ex) {
            ex.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    public ByteArrayInputStream generateTransferExcel(Long propertyId) {
        List<AssetTransferLog> logs = getLogs(propertyId);
        
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Asset Transfers");

            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Date", "Asset Name", "From Property", "To Property", "Transferred By", "Note"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            // Data Rows
            int rowIdx = 1;
            for (AssetTransferLog log : logs) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(log.getTransferDate().toString());
                row.createCell(1).setCellValue(log.getAssetName());
                row.createCell(2).setCellValue(log.getFromPropertyName());
                row.createCell(3).setCellValue(log.getToPropertyName());
                row.createCell(4).setCellValue(log.getTransferredBy());
                row.createCell(5).setCellValue(log.getTransferNote() != null ? log.getTransferNote() : "-");
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Fail to import data to Excel file: " + e.getMessage());
        }
    }

    private List<AssetTransferLog> getLogs(Long propertyId) {
        if (propertyId != null) {
            return transferLogRepository.findByFromPropertyIdOrToPropertyIdOrderByTransferDateDesc(propertyId, propertyId);
        }
        return transferLogRepository.findAll();
    }
}
