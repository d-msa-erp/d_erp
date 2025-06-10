package kr.co.d_erp.service;


import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.domain.BomDtl;
import kr.co.d_erp.dtos.BomDtlRequestDto;
import kr.co.d_erp.dtos.BomExcelViewProjection;
import kr.co.d_erp.dtos.BomItemDetailDto;
import kr.co.d_erp.dtos.BomListItemDto;
import kr.co.d_erp.dtos.BomListItemProjection;
import kr.co.d_erp.dtos.BomSaveRequestDto;
import kr.co.d_erp.dtos.BomSequenceUpdateDto;
import kr.co.d_erp.dtos.BomSummaryDto;
import kr.co.d_erp.dtos.BomSummaryProjection;
import kr.co.d_erp.dtos.BomUpdateRequestDto;
import kr.co.d_erp.dtos.ItemSelectionDto;
import kr.co.d_erp.dtos.ItemSelectionProjection;
import kr.co.d_erp.dtos.Itemmst; //
import kr.co.d_erp.repository.oracle.BomDtlRepository; //
import kr.co.d_erp.repository.oracle.ItemmstRepository; //
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BomServiceImpl implements BomService {

    private final BomDtlRepository bomDtlRepository; //
    private final ItemmstRepository itemmstRepository; //

    @Override
    public List<BomSummaryDto> getBomSummaryList() {
        List<BomSummaryProjection> projections = itemmstRepository.findBomSummaries();
        return projections.stream()
            .map(p -> new BomSummaryDto(
                p.getItemIdx(),
                p.getPitemCd(),
                p.getPitemNm(),
                p.getCatNm(),
                p.getPunitNm(),
                p.getPtotalRawMaterialCost() != null ? p.getPtotalRawMaterialCost() : BigDecimal.ZERO
            ))
            .collect(Collectors.toList());
    }

    @Override
    public BomItemDetailDto getBomDetails(Long parentItemIdx) { //
        // 1. 리포지토리에서 프로젝션 리스트를 받습니다.
        List<BomListItemProjection> projections = bomDtlRepository.findBomListWithParentDetails(parentItemIdx);

        // 2. 하위 품목(projections)이 없는 경우 처리
        if (projections == null || projections.isEmpty()) {
            return itemmstRepository.findById(parentItemIdx)
                .map(parent -> { // parent는 Itemmst 객체
                    BomItemDetailDto dto = new BomItemDetailDto();
                    dto.setItemIdx(parent.getItemIdx());
                    dto.setItemCd(parent.getItemCd());
                    dto.setItemNm(parent.getItemNm());
                    dto.setItemFlag(parent.getItemFlag());
                    dto.setItemSpec(parent.getItemSpec());
                    dto.setItemCost(parent.getItemCost() != null ? BigDecimal.valueOf(parent.getItemCost()) : null); // Double to BigDecimal
                    // Itemmst 엔티티에 cycleTime, remark 필드가 있어야 합니다.
                    // dto.setCycleTime(parent.getCycleTime()); // Itemmst에 getCycleTime() 필요
                    // dto.setRemark(parent.getRemark());       // Itemmst에 getRemark() 필요
                    if (parent.getRemark() != null) { // Itemmst의 remark 사용
                        dto.setRemark(parent.getRemark());
                    }
                    // Itemmst에 cycleTime 필드 추가 후 아래 주석 해제
                    // if (parent.getCycleTime() != null) {
                    //    dto.setCycleTime(parent.getCycleTime());
                    // }
                    dto.setComponents(new ArrayList<>());
                    return dto;
                })
                .orElse(null);
        }

        // 3. 하위 품목이 있는 경우:
        BomListItemProjection firstProjection = projections.get(0);
        BomItemDetailDto detailDto = new BomItemDetailDto();

        // 3-1. 첫 번째 프로젝션에서 상위 품목 정보 설정
        detailDto.setItemIdx(firstProjection.getParentItemIdx());
        detailDto.setItemCd(firstProjection.getParentItemCd());
        detailDto.setItemNm(firstProjection.getParentItemNm());
        detailDto.setItemFlag(firstProjection.getParentItemFlag());
        detailDto.setItemSpec(firstProjection.getParentItemSpec());
        detailDto.setCycleTime(firstProjection.getParentCycleTime());
        detailDto.setRemark(firstProjection.getParentRemark());
        // 상위 품목의 itemCost는 BomItemDetailDto에 필드가 있으므로, Itemmst에서 가져온 값으로 채워야 합니다.
        // 이 값은 firstProjection에는 없으므로, itemmstRepository.findById로 다시 조회하거나,
        // Itemmst 엔티티에 있는 값을 활용 (위 '하위 품목 없는 경우'와 유사하게 처리)
        // 여기서는 간단히 null로 두거나, 필요시 Itemmst에서 조회하여 채웁니다.
        // (또는 ItemmstRepository.findById를 여기서 한번 더 호출하여 상위 품목의 itemCost를 명확히 가져올 수 있습니다)
        itemmstRepository.findById(firstProjection.getParentItemIdx()).ifPresent(parentFullInfo -> {
            if(parentFullInfo.getItemCost() != null) {
                detailDto.setItemCost(BigDecimal.valueOf(parentFullInfo.getItemCost()));
            }
        });


        // 3-2. 프로젝션 리스트를 BomListItemDto 리스트로 변환 (하위 품목 정보)
        List<BomListItemDto> components = projections.stream()
            .map(p -> new BomListItemDto(
                p.getBomIdx(),
                p.getSubItemIdx(),
                p.getSubItemCd(),
                p.getSubItemNm(),
                p.getUseQty(),
                p.getUnitNm(),
                p.getItemFlag(),    // 하위 품목 Flag
                p.getSeqNo(),
                p.getLossRt(),
                p.getItemPrice(),
                p.getRemark(),     // 하위 품목 비고
                p.getSubItemMasterCost(),//하위 품목 마스터원가
                p.getSubQty()
            ))
            .collect(Collectors.toList());

        // 3-3. 변환된 DTO 리스트를 설정
        detailDto.setComponents(components);

        return detailDto;
    }

    @Override
    @Transactional
    public boolean updateBomSequence(Long parentItemIdx, List<BomSequenceUpdateDto> sequenceUpdates) { //
        //system.out.println("Updating sequence for " + parentItemIdx);
        return true;
    }

    @Override
    public List<ItemSelectionDto> getItemsForSelectionByFlag(String itemFlag) {
        List<ItemSelectionProjection> projections = itemmstRepository.findItemsByFlagForSelection(itemFlag);
        return projections.stream()
            .map(p -> new ItemSelectionDto(
                p.getItemIdx(),
                p.getItemCd(),
                p.getItemNm(),
                p.getItemSpec(),
                p.getUnitNm(),
                p.getItemCost()// ★★★ 프로젝션에서 itemCost 매핑 ★★★
            ))
            .collect(Collectors.toList());
    }
    
    
    //Bom수정
    @Override
    @Transactional
    public boolean updateBom(Long parentItemIdx, BomUpdateRequestDto requestDto) {
        //system.out.println("--- BomServiceImpl.updateBom 시작 ---");
        //system.out.println("Parent Item IDX: " + parentItemIdx);
        //system.out.println("Request DTO: " + requestDto.toString()); // DTO 내용 전체 로깅

        try {
            // 1. 상위 품목 정보 업데이트
            Itemmst parentItem = itemmstRepository.findById(parentItemIdx)
                    .orElseThrow(() -> {
                        
                        return new IllegalArgumentException("수정할 상위 품목을 찾을 수 없습니다: " + parentItemIdx);
                    });
            //system.out.println("상위 품목 조회 성공: " + parentItem.getItemNm());

            if (requestDto.getParentCycleTime() != null) {
                parentItem.setCycleTime(requestDto.getParentCycleTime());
            }
            parentItem.setRemark(requestDto.getParentRemark());
            itemmstRepository.save(parentItem);
            //system.out.println("상위 품목 정보 업데이트 성공.");

         // 2. 기존 하위 구성품 삭제
            List<BomDtl> existingChildren =
                bomDtlRepository.findByParentItemIdxOrderBySeqNoAsc(parentItemIdx);
            //system.out.println("삭제할 기존 하위 구성품 수: " + existingChildren.size());
            bomDtlRepository.deleteAll(existingChildren);

            // ← 여기서 삭제 작업을 즉시 DB에 반영하도록 flush() 호출
            bomDtlRepository.flush();

            //system.out.println("기존 하위 구성품 삭제 완료.");

            // 3. 새로운 하위 구성품 추가
            if (requestDto.getComponents() != null && !requestDto.getComponents().isEmpty()) {

                List<BomDtl> newChildren = new ArrayList<>();
                for (BomDtlRequestDto compDto : requestDto.getComponents()) {
                    //system.out.println("  처리 중인 하위 품목 DTO: subItemIdx=" + compDto.getSubItemIdx() + ", seqNo=" + compDto.getSeqNo());
                    BomDtl newBomDtl = new BomDtl();
                    newBomDtl.setParentItemIdx(parentItemIdx);

                    Itemmst subItem = itemmstRepository.findById(compDto.getSubItemIdx())
                            .orElseThrow(() -> {
                                
                                return new IllegalArgumentException("하위 품목을 찾을 수 없습니다: " + compDto.getSubItemIdx());
                            });
                    newBomDtl.setSubItemIdx(subItem.getItemIdx());
                    //system.out.println("    하위 품목 조회 성공: " + subItem.getItemNm());

                    newBomDtl.setUseQty(compDto.getUseQty());
                    newBomDtl.setLossRt(compDto.getLossRate());
                    newBomDtl.setItemPrice(compDto.getItemPrice());
                    newBomDtl.setRemark(compDto.getRemark());
                    newBomDtl.setSeqNo(compDto.getSeqNo());
                    newChildren.add(newBomDtl);
                }
                //system.out.println("DB에 저장할 newChildren 리스트: " + newChildren.size() + "개 항목");
                

                bomDtlRepository.saveAll(newChildren); // 여기서 ORA-00001 발생 가능성
                //system.out.println("새로운 하위 구성품 추가 완료.");
            } else {
                //system.out.println("추가할 새로운 하위 구성품 없음.");
            }
            //system.out.println("--- BomServiceImpl.updateBom 성공적으로 완료 ---");
            return true;
        } catch (Exception e) {
            
            e.printStackTrace(); // 전체 스택 트레이스 출력
            // 가능하다면 더 구체적인 예외를 잡아서 로깅하는 것이 좋습니다.
            // 예: catch (DataIntegrityViolationException dive) { ... }
            //     catch (IllegalArgumentException iae) { ... }
            return false;
        }
    }
    //저장용
    @Override
    @Transactional // 데이터 일관성을 위해 트랜잭션 처리
    public boolean saveNewBom(BomSaveRequestDto bomSaveRequestDto) {
        //system.out.println("--- BomServiceImpl.saveNewBom 시작 ---");
        //system.out.println("Request DTO: " + bomSaveRequestDto.toString()); // DTO 내용 로깅

        try {
            // 1. 상위 품목(Itemmst) 엔티티 조회
            Long parentItemIdx = bomSaveRequestDto.getParentItemIdx();
            Itemmst parentItem = itemmstRepository.findById(parentItemIdx)
                    .orElseThrow(() -> {
                        String errorMsg = "신규 BOM 저장 실패: 상위 품목을 찾을 수 없습니다. ID: " + parentItemIdx;
                        
                        return new IllegalArgumentException(errorMsg); // 예외를 발생시켜 트랜잭션 롤백 유도
                    });
            //system.out.println("상위 품목 조회 성공: " + parentItem.getItemNm());

            // 2. 상위 품목(Itemmst) 정보 업데이트 (CycleTime, Remark 등)
            // Itemmst 엔티티에 setCycleTime, setRemark 메소드가 BigDecimal, String 타입을 받도록 정의되어 있어야 합니다.
            if (bomSaveRequestDto.getParentCycleTime() != null) {
                // DTO의 parentCycleTime 타입(BigDecimal 또는 Double)과 Itemmst 엔티티의 cycleTime 필드 타입 일치 필요
                // 예시: parentItem.setCycleTime(bomSaveRequestDto.getParentCycleTime());
                // 만약 Itemmst의 cycleTime 타입이 Double이라면 변환 필요:
                // parentItem.setCycleTime(bomSaveRequestDto.getParentCycleTime().doubleValue());
                // 또는 Itemmst의 cycleTime 타입이 BigDecimal이라면 그대로 사용:
                parentItem.setCycleTime(bomSaveRequestDto.getParentCycleTime());
            }
            if (bomSaveRequestDto.getParentRemark() != null) {
                parentItem.setRemark(bomSaveRequestDto.getParentRemark());
            }
            itemmstRepository.save(parentItem); // 변경된 상위 품목 정보 저장
            //system.out.println("상위 품목 정보 업데이트/저장 성공.");

            // 3. 해당 상위 품목(parentItemIdx)을 가지는 기존 BomDtl 데이터 삭제
            //    (updateBom 메소드의 로직을 참고하여, 신규 등록 시에도 기존 관계를 정리하고 새로 삽입하는 방식)
            List<BomDtl> existingChildren = bomDtlRepository.findByParentItemIdxOrderBySeqNoAsc(parentItemIdx);
            if (existingChildren != null && !existingChildren.isEmpty()) {
                //system.out.println("신규 등록 전, parentItemIdx " + parentItemIdx + " 에 연결된 기존 BomDtl " + existingChildren.size() + "개 삭제 시도.");
                bomDtlRepository.deleteAll(existingChildren);
                bomDtlRepository.flush(); // DB에 즉시 반영 (JPA 최적화로 인해 실제 삭제는 flush/commit 시점에 이루어질 수 있음)
                //system.out.println("기존 BomDtl 삭제 완료.");
            } else {
                //system.out.println("parentItemIdx " + parentItemIdx + " 에 연결된 기존 BomDtl 없음.");
            }

            // 4. 새로운 BomDtl 엔티티 생성 및 저장 (하위 품목 구성 정보)
            List<BomDtl> bomDetailsToSave = new ArrayList<>();
            if (bomSaveRequestDto.getComponents() != null && !bomSaveRequestDto.getComponents().isEmpty()) {
                //system.out.println("새로운 하위 구성품(BomDtl) 추가 시도. 추가할 구성품 수: " + bomSaveRequestDto.getComponents().size());

                for (BomSaveRequestDto.BomComponentSaveDto componentDto : bomSaveRequestDto.getComponents()) {
                    // 하위 품목(Itemmst) 엔티티 조회
                    Itemmst subItem = itemmstRepository.findById(componentDto.getSubItemIdx())
                            .orElseThrow(() -> {
                                String errorMsg = "신규 BOM 저장 실패: 하위 품목(원자재)을 찾을 수 없습니다. ID: " + componentDto.getSubItemIdx();
                                
                                return new IllegalArgumentException(errorMsg); // 예외 발생
                            });
                    //system.out.println("  처리 중인 하위 품목: " + subItem.getItemNm() + " (ID: " + subItem.getItemIdx() + ")");

                    BomDtl bomDtl = new BomDtl();
                    bomDtl.setParentItemIdx(parentItemIdx);       // 상위 품목의 ID (Itemmst의 PK)
                    bomDtl.setSubItemIdx(subItem.getItemIdx());   // 하위 품목의 ID (Itemmst의 PK)

                    // DTO의 필드명을 BomDtl 엔티티 필드명 및 타입에 맞게 설정
                    // BomDtl 엔티티에 useQty, lossRt, itemPrice, remark, seqNo 필드와 setter가 적절한 타입으로 있어야 함
                    bomDtl.setUseQty(componentDto.getUseQty());     // 타입 확인 (BigDecimal or Double)
                    bomDtl.setLossRt(componentDto.getLossRate());   // 타입 확인 및 필드명 확인 (lossRt vs lossRate)
                    bomDtl.setItemPrice(componentDto.getItemPrice()); // 타입 확인
                    bomDtl.setRemark(componentDto.getRemark());
                    bomDtl.setSeqNo(componentDto.getSeqNo());
                    // bomDtl.setUseYn("Y"); // 등 필요한 기본값 설정이 있다면 추가

                    bomDetailsToSave.add(bomDtl);
                }

                if (!bomDetailsToSave.isEmpty()) {
                    
                    
                    bomDtlRepository.saveAll(bomDetailsToSave); // 하위 품목들 일괄 저장
                    
                }
            } else {
                //system.out.println("추가할 하위 구성품(BomDtl) 없음.");
                // 하위 품목이 없는 BOM도 허용할 것인지, 아니면 여기서 오류/false를 반환할지 정책에 따라 결정
            }

            //system.out.println("--- BomServiceImpl.saveNewBom 성공적으로 완료 ---");
            return true;

        } catch (IllegalArgumentException e) { // findById 등에서 발생한 예외 (품목 못 찾음 등)
            
            // @Transactional에 의해 롤백됨
            return false;
        } catch (Exception e) { // 그 외 모든 예외
            
            e.printStackTrace(); // 전체 스택 트레이스 출력
            // @Transactional에 의해 롤백됨
            return false;
        }
    }
    
    // =============== 엑셀 생성 메소드 구현 ===============
    @Override
    public Workbook generateBomDetailsExcel(List<Long> bomIds) {
        Workbook workbook = new XSSFWorkbook();

        // --- 스타일 정의 ---
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 10);
        headerStyle.setFont(headerFont);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        DataFormat fmt = workbook.createDataFormat();
        headerStyle.setDataFormat(fmt.getFormat("@")); // 텍스트 형식으로 강제
        setAllBorders(headerStyle, BorderStyle.THIN);


        CellStyle titleStyle = workbook.createCellStyle();
        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        titleStyle.setFont(titleFont);
        titleStyle.setAlignment(HorizontalAlignment.CENTER);
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle parentLabelStyle = workbook.createCellStyle();
        Font parentLabelFont = workbook.createFont();
        parentLabelFont.setBold(true);
        parentLabelFont.setFontHeightInPoints((short)10);
        parentLabelStyle.setFont(parentLabelFont);
        parentLabelStyle.setAlignment(HorizontalAlignment.LEFT);
        parentLabelStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        parentLabelStyle.setDataFormat(fmt.getFormat("@"));
        // parentLabelStyle.setBorderBottom(BorderStyle.DOTTED);


        CellStyle dataStyle = workbook.createCellStyle();
        Font dataFont = workbook.createFont();
        dataFont.setFontHeightInPoints((short)10);
        dataStyle.setFont(dataFont);
        setAllBorders(dataStyle, BorderStyle.THIN);
        dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        dataStyle.setWrapText(true);
        dataStyle.setDataFormat(fmt.getFormat("@"));


        CellStyle numericDataStyle = workbook.createCellStyle();
        numericDataStyle.cloneStyleFrom(dataStyle);
        numericDataStyle.setAlignment(HorizontalAlignment.RIGHT);
        numericDataStyle.setDataFormat(fmt.getFormat("#,##0.###")); // 소수점 3자리까지 표시

        CellStyle defaultNumericDataStyle = workbook.createCellStyle(); // 기본 숫자 형식 (정수)
        defaultNumericDataStyle.cloneStyleFrom(dataStyle);
        defaultNumericDataStyle.setAlignment(HorizontalAlignment.RIGHT);
        defaultNumericDataStyle.setDataFormat(fmt.getFormat("#,##0"));

        // --- 스타일 정의 끝 ---

        if (bomIds == null || bomIds.isEmpty()) {
            Sheet sheet = workbook.createSheet("정보 없음");
            Row row = sheet.createRow(0);
            row.createCell(0).setCellValue("선택된 BOM ID가 없습니다.");
            return workbook;
        }

        List<BomExcelViewProjection> allExcelData = bomDtlRepository.findExcelDataByParentItemIdxIn(bomIds);

        if (allExcelData.isEmpty()) {
            Sheet sheet = workbook.createSheet("데이터 없음");
            Row row = sheet.createRow(0);
            row.createCell(0).setCellValue("선택된 BOM ID에 대한 데이터가 없습니다.");
            return workbook;
        }

        Map<Long, List<BomExcelViewProjection>> groupedByParent = allExcelData.stream()
                .collect(Collectors.groupingBy(BomExcelViewProjection::getParentItemIdx));

        for (Map.Entry<Long, List<BomExcelViewProjection>> entry : groupedByParent.entrySet()) {
            List<BomExcelViewProjection> componentsForThisParent = entry.getValue();
            BomExcelViewProjection parentInfoProjection = componentsForThisParent.get(0);

            String safeSheetName = (parentInfoProjection.getParentItemCd() != null ? parentInfoProjection.getParentItemCd() : "BOM_ID_" + parentInfoProjection.getParentItemIdx()).replaceAll("[\\\\/?*\\[\\]]", "_");
            if (safeSheetName.length() > 30) safeSheetName = safeSheetName.substring(0, 30);
            Sheet sheet = workbook.createSheet(safeSheetName);
            AtomicInteger rowNum = new AtomicInteger(0);

            Row titleRowExcel = sheet.createRow(rowNum.getAndIncrement());
            titleRowExcel.setHeightInPoints((short) (14 * 1.5));
            Cell titleCellExcel = titleRowExcel.createCell(0);
            titleCellExcel.setCellValue(parentInfoProjection.getParentItemNm() + " (품목코드: " + parentInfoProjection.getParentItemCd() + ") - BOM 상세 정보");
            titleCellExcel.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(titleRowExcel.getRowNum(), titleRowExcel.getRowNum(), 0, 7));
            rowNum.getAndIncrement();

            createParentInfoSectionForExcel(sheet, rowNum, parentInfoProjection, parentLabelStyle, dataStyle);
            rowNum.getAndIncrement();

            Row componentsTitleRowExcel = sheet.createRow(rowNum.getAndIncrement());
            Cell componentsTitleCellExcel = componentsTitleRowExcel.createCell(0);
            componentsTitleCellExcel.setCellValue("하위 품목 구성");
            Font componentsTitleFontExcel = workbook.createFont();
            componentsTitleFontExcel.setBold(true);
            componentsTitleFontExcel.setFontHeightInPoints((short)11);
            CellStyle compTitleStyleExcel = workbook.createCellStyle();
            compTitleStyleExcel.setFont(componentsTitleFontExcel);
            componentsTitleCellExcel.setCellStyle(compTitleStyleExcel);

            String[] headers = {"No", "하위품목명", "하위품목코드", "소요량", "단위", "로스율(%)", "단가(원)", "비고"};
            Row headerExcelRow = sheet.createRow(rowNum.getAndIncrement());
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerExcelRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            if (componentsForThisParent != null && !componentsForThisParent.isEmpty()) {
                int componentNo = 1;
                for (BomExcelViewProjection component : componentsForThisParent) {
                    Row dataRow = sheet.createRow(rowNum.getAndIncrement());
                    createCell(dataRow, 0, componentNo++, defaultNumericDataStyle); // No는 정수
                    createCell(dataRow, 1, component.getSubItemNm(), dataStyle);
                    createCell(dataRow, 2, component.getSubItemCd(), dataStyle);
                    createCell(dataRow, 3, component.getUseQty(), numericDataStyle); // 소요량 (소수점 가능)
                    createCell(dataRow, 4, component.getSubItemUnitNm(), dataStyle);
                    createCell(dataRow, 5, component.getLossRt(), numericDataStyle); // 로스율 (소수점 가능)
                    createCell(dataRow, 6, component.getItemPrice() != null ? Math.round(component.getItemPrice().doubleValue()) : null, defaultNumericDataStyle); // 단가는 정수
                    createCell(dataRow, 7, component.getSubItemRemark(), dataStyle);
                }
            } else {
                Row noDataRow = sheet.createRow(rowNum.getAndIncrement());
                Cell noDataCell = noDataRow.createCell(0);
                noDataCell.setCellValue("등록된 하위 품목이 없습니다.");
                sheet.addMergedRegion(new CellRangeAddress(noDataRow.getRowNum(), noDataRow.getRowNum(), 0, headers.length - 1));
                noDataCell.setCellStyle(dataStyle);
            }

            sheet.setColumnWidth(0, 1200); sheet.setColumnWidth(1, 7000); sheet.setColumnWidth(2, 4000);
            sheet.setColumnWidth(3, 2500); sheet.setColumnWidth(4, 2000); sheet.setColumnWidth(5, 2500);
            sheet.setColumnWidth(6, 3000); sheet.setColumnWidth(7, 7000);
        }
        return workbook;
    }

    // 모든 테두리 설정 헬퍼 메소드
    private void setAllBorders(CellStyle style, BorderStyle borderStyle) {
        style.setBorderTop(borderStyle);
        style.setBorderBottom(borderStyle);
        style.setBorderLeft(borderStyle);
        style.setBorderRight(borderStyle);
    }

    private void createCell(Row row, int columnIdx, Object value, CellStyle style) {
        Cell cell = row.createCell(columnIdx);
        if (value == null) {
            cell.setCellValue("N/A"); // null 값 처리
        } else if (value instanceof String) {
            cell.setCellValue((String) value);
        } else if (value instanceof BigDecimal) {
            cell.setCellValue(((BigDecimal) value).doubleValue());
        } else if (value instanceof Number) { // Integer, Long, Double 등
            cell.setCellValue(((Number) value).doubleValue());
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else {
            cell.setCellValue(value.toString()); // 기타 타입은 문자열로
        }
        cell.setCellStyle(style);
    }

    private void createParentInfoSectionForExcel(Sheet sheet, AtomicInteger rowNum, BomExcelViewProjection parentData, CellStyle labelStyle, CellStyle dataStyle) {
        String[][] parentInfoData = {
            {"상위 품목명:", parentData.getParentItemNm() != null ? parentData.getParentItemNm() : "N/A"},
            {"품목 코드:", parentData.getParentItemCd() != null ? parentData.getParentItemCd() : "N/A"},
            {"대분류:", parentData.getParentCategoryNm() != null ? parentData.getParentCategoryNm() : "N/A"},
            {"단위:", parentData.getParentUnitNm() != null ? parentData.getParentUnitNm() : "N/A"},
            {"생산성:", parentData.getParentCycleTime() != null ? String.valueOf(parentData.getParentCycleTime()) : "N/A"},
            {"비고 (상위):", parentData.getParentRemark() != null ? parentData.getParentRemark() : ""}
        };

        for (String[] info : parentInfoData) {
            Row infoRow = sheet.createRow(rowNum.getAndIncrement());
            Cell labelCell = infoRow.createCell(0);
            labelCell.setCellValue(info[0]);
            labelCell.setCellStyle(labelStyle);
            sheet.setColumnWidth(0, 4000);

            Cell valueCell = infoRow.createCell(1);
            valueCell.setCellValue(info[1]);
            valueCell.setCellStyle(dataStyle);
            sheet.setColumnWidth(1, 8000);
            // 필요시 2개 이상의 셀 병합
            // sheet.addMergedRegion(new CellRangeAddress(infoRow.getRowNum(), infoRow.getRowNum(), 1, 2)); // 예: 값 셀을 2,3번째 컬럼에 걸쳐 표시
        }
    }
    
    
    
    
}