package kr.co.d_erp.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.domain.Custmst;
import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.dtos.CustomerDTO;
import kr.co.d_erp.dtos.CustomerForSelectionDto;
import kr.co.d_erp.repository.oracle.CustmstRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustmstService {

    private final CustmstRepository custmstRepository;

    public Page<Custmst> getCustomers(String bizFlag, String sortKey, String sortDirection, String keyword, int page) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, 10, Sort.by(direction, sortKey));

        if (keyword == null || keyword.isBlank()) {
            return custmstRepository.findByBizFlag(bizFlag, pageable);
        } else {
            return custmstRepository.findByBizFlagAndKeyword(bizFlag, "%" + keyword + "%", pageable);
        }
    }

    // 상세 조회
    public Optional<Custmst> getCustomerById(Long id) {
        return custmstRepository.findById(id);
    }

    // 등록
    public Custmst saveCustomer(Custmst custmst) {
        return custmstRepository.save(custmst);
    }

    // 수정
    public Custmst updateCustomer(Long custIdx, Custmst updatedCust) {
        Custmst existingCust = custmstRepository.findById(custIdx)
            .orElseThrow(() -> new RuntimeException("데이터를 찾을 수 없습니다: " + custIdx));

        existingCust.setCustNm(updatedCust.getCustNm());
        existingCust.setPresidentNm(updatedCust.getPresidentNm());
        existingCust.setBizNo(updatedCust.getBizNo());
        existingCust.setBizTel(updatedCust.getBizTel());
        existingCust.setCustEmail(updatedCust.getCustEmail());
        existingCust.setBizFax(updatedCust.getBizFax());
        existingCust.setBizCond(updatedCust.getBizCond());
        existingCust.setBizItem(updatedCust.getBizItem());
        existingCust.setCompEmpNm(updatedCust.getCompEmpNm());
        existingCust.setCompNo(updatedCust.getCompNo());
        existingCust.setBizAddr(updatedCust.getBizAddr());

        return custmstRepository.save(existingCust);
    }

    // 고객 삭제
    public void deleteCustomer(Long id) {
        custmstRepository.deleteById(id);
    }

    // 거래처 목록 DTO (bizFlag=02)
    public List<CustomerDTO> getCustomerNamesWithCode(String bizFlag) {
        return custmstRepository.findCustIdxAndCustNmByBizFlag(bizFlag);
    }

    // Datalist용 거래처 정보 조회 메소드
    @Transactional(readOnly = true)
    public List<CustomerForSelectionDto> findActiveCustomersForSelection(String bizFlag) {
        Sort defaultSort = Sort.by(Sort.Direction.ASC, "custNm");
        Pageable pageable = PageRequest.of(0, 1000, defaultSort); // 최대 1000개 제한

        List<Custmst> customers;

        if (bizFlag != null && !bizFlag.isEmpty()) {
            customers = custmstRepository.findByBizFlag(bizFlag, pageable).getContent();
        } else {
            customers = custmstRepository.findAll(pageable).getContent();
        }

        return customers.stream()
                .map(cust -> new CustomerForSelectionDto(
                        cust.getCustIdx(),
                        cust.getCustNm(),
                        cust.getCustCd()
                ))
                .collect(Collectors.toList());
    }
    
    public byte[] generateExcel() throws IOException {
	 	List<Custmst> custList = custmstRepository.findAll();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("주문목록");

            // 헤더 작성
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("거래처코드");
            header.createCell(1).setCellValue("거래처명");
            header.createCell(2).setCellValue("대표자명");
            header.createCell(3).setCellValue("연락처");
            header.createCell(4).setCellValue("이메일");


            // 데이터 작성
            int rowIdx = 1;
            for (Custmst cust : custList) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(cust.getCustCd());
                row.createCell(1).setCellValue(cust.getCustNm());
                row.createCell(2).setCellValue(cust.getPresidentNm());
                row.createCell(3).setCellValue(cust.getBizTel());
                row.createCell(4).setCellValue(cust.getCustEmail());
            }

            // 엑셀 데이터를 바이트 배열로 반환
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                workbook.write(out);
                return out.toByteArray();
            }
        }
    }
}
