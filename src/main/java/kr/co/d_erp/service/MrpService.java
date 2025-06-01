package kr.co.d_erp.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.dtos.BomItemDetailDto;
import kr.co.d_erp.dtos.MrpFirstDto;
import kr.co.d_erp.dtos.MrpSecondDto;

public interface MrpService {
	
	
    Page<MrpFirstDto> findMrpTargetOrders(String orderTypeFilter, String searchKeyword, Pageable pageable); // 반환 타입 변경

    Page<MrpSecondDto> findMrpResults(Long orderIdx, Pageable pageable);

    BomItemDetailDto getBomDetailsForMrp(Long parentItemId);
    
}

