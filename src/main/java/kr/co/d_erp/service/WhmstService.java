package kr.co.d_erp.service;

import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.domain.WarehouseInventoryDetailView;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.StockTransferItemDto;
import kr.co.d_erp.dtos.StockTransferRequestDto;
import kr.co.d_erp.dtos.WhmstDto;
import kr.co.d_erp.dtos.WarehouseInventoryDetailDto;
import kr.co.d_erp.repository.oracle.UsermstRepository;
import kr.co.d_erp.repository.oracle.WhmstRepository;
import kr.co.d_erp.repository.oracle.WarehouseInventoryDetailViewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
@RequiredArgsConstructor
public class WhmstService {

	private final WhmstRepository whmstRepository;
	private final UsermstRepository usermstRepository;
	private final WarehouseInventoryDetailViewRepository warehouseInventoryDetailViewRepository;
	private final InvTransactionService invTransactionService;

	/**
	 * 창고간 재고 이동을 처리합니다.
	 * @param fromWhIdx 출발 창고 ID
	 * @param request 창고 이동 요청 정보
	 * @return 처리 결과 메시지
	 */
	@Transactional
	public String transferStock(Long fromWhIdx, StockTransferRequestDto request) {
		try {
			// 출발 창고와 목적지 창고 존재 여부 확인
			if (!whmstRepository.existsById(fromWhIdx)) {
				throw new IllegalArgumentException("출발 창고를 찾을 수 없습니다: " + fromWhIdx);
			}
			if (!whmstRepository.existsById(request.getToWhIdx())) {
				throw new IllegalArgumentException("목적지 창고를 찾을 수 없습니다: " + request.getToWhIdx());
			}

			// 같은 창고로 이동하는 경우 체크
			if (fromWhIdx.equals(request.getToWhIdx())) {
				throw new IllegalArgumentException("출발 창고와 목적지 창고가 같을 수 없습니다.");
			}

			StringBuilder resultMessage = new StringBuilder();
			int successCount = 0;
			int totalCount = request.getItems().size();
			LocalDate transferDate = LocalDate.now();

			for (StockTransferItemDto item : request.getItems()) {
				try {
					// 출발 창고에서 출고 처리
					InvTransactionRequestDto outboundRequest = new InvTransactionRequestDto();
					outboundRequest.setTransType("S"); // 출고
					outboundRequest.setWhIdx(fromWhIdx);
					outboundRequest.setTransDate(transferDate);
					outboundRequest.setTransQty(item.getTransferQty());
					outboundRequest.setUnitPrice(BigDecimal.ZERO); // 창고 이동은 단가 0
					outboundRequest.setTransStatus("S2"); // 출고완료
					outboundRequest.setItemIdx(item.getItemIdx());
					if (request.getCustIdx() != null) {
						outboundRequest.setCustIdx(request.getCustIdx());
					}
					if (request.getUserIdx() != null) {
						outboundRequest.setUserIdx(request.getUserIdx());
					}
					outboundRequest.setRemark("창고이동 출고" + 
						    (request.getRemark() != null && !request.getRemark().trim().isEmpty() 
						        ? " : " + request.getRemark() 
						        : ""));

					invTransactionService.insertTransaction(outboundRequest);

					// 목적지 창고로 입고 처리
					InvTransactionRequestDto inboundRequest = new InvTransactionRequestDto();
					inboundRequest.setTransType("R"); // 입고
					inboundRequest.setWhIdx(request.getToWhIdx());
					inboundRequest.setTransDate(transferDate);
					inboundRequest.setTransQty(item.getTransferQty());
					inboundRequest.setUnitPrice(BigDecimal.ZERO); // 창고 이동은 단가 0
					inboundRequest.setTransStatus("R3"); // 입고완료
					inboundRequest.setItemIdx(item.getItemIdx());
					if (request.getCustIdx() != null) {
						inboundRequest.setCustIdx(request.getCustIdx());
					}
					if (request.getUserIdx() != null) {
						inboundRequest.setUserIdx(request.getUserIdx());
					}
					inboundRequest.setRemark("창고이동 입고" + 
						    (request.getRemark() != null && !request.getRemark().trim().isEmpty() 
						        ? " : " + request.getRemark() 
						        : ""));
					invTransactionService.insertTransaction(inboundRequest);
					successCount++;

				} catch (Exception e) {
					e.printStackTrace();
					resultMessage.append(String.format("품목 ID %d 이동 실패: %s\n", item.getItemIdx(), e.getMessage()));
					// 개별 아이템 실패 시에도 전체 트랜잭션을 롤백하지 않음
				}
			}

			String result;
			if (successCount == totalCount) {
				result = String.format("모든 재고 이동이 완료되었습니다. (%d건)", successCount);
			} else {
				result = String.format("재고 이동 완료: %d/%d건\n%s", successCount, totalCount, resultMessage.toString());
			}
			return result;

		} catch (Exception e) {
			e.printStackTrace();
			throw e; // 예외를 다시 던져서 트랜잭션 롤백 발생
		}
	}

	/**
	 * 창고의 선택된 재고들을 삭제합니다.
	 * @param whIdx 창고 ID
	 * @param invIdxList 삭제할 재고 ID 목록 (invIdx)
	 * @return 처리 결과 메시지
	 */
	@Transactional
	public String deleteWarehouseInventory(Long whIdx, List<Long> invIdxList) {
		try {
			// 창고 존재 여부 확인
			if (!whmstRepository.existsById(whIdx)) {
				throw new RuntimeException("창고를 찾을 수 없습니다. ID: " + whIdx);
			}

			// 재고 존재 여부 및 권한 확인
			List<WarehouseInventoryDetailView> inventoriesToDelete = new ArrayList<>();
			for (Long invIdx : invIdxList) {
				Optional<WarehouseInventoryDetailView> inventoryOpt = warehouseInventoryDetailViewRepository.findById(invIdx);
				if (!inventoryOpt.isPresent()) {
					throw new RuntimeException("재고를 찾을 수 없습니다. ID: " + invIdx);
				}

				WarehouseInventoryDetailView inventory = inventoryOpt.get();

				// 해당 재고가 요청된 창고의 재고인지 확인
				if (!inventory.getWhIdx().equals(whIdx)) {
					throw new RuntimeException("재고 ID " + invIdx + "는 창고 ID " + whIdx + "에 속하지 않습니다.");
				}

				// 재고 수량이 0보다 큰 것만 삭제 대상으로 추가
				if (inventory.getStockQty() != null && inventory.getStockQty().compareTo(BigDecimal.ZERO) > 0) {
					inventoriesToDelete.add(inventory);
				}
			}

			if (inventoriesToDelete.isEmpty()) {
				return "삭제할 재고가 없습니다. (재고 수량이 모두 0입니다)";
			}

			// 각 재고에 대해 출고 트랜잭션 처리
			LocalDate deleteDate = LocalDate.now();
			int successCount = 0;
			int totalCount = inventoriesToDelete.size();
			StringBuilder errorMessages = new StringBuilder();

			for (WarehouseInventoryDetailView inventory : inventoriesToDelete) {
				try {
					// 현재 재고량만큼 출고 처리
					InvTransactionRequestDto deleteRequest = new InvTransactionRequestDto();
					deleteRequest.setTransType("S"); // 출고
					deleteRequest.setWhIdx(whIdx);
					deleteRequest.setTransDate(deleteDate);
					deleteRequest.setTransQty(inventory.getStockQty()); // 현재 재고량 전체
					deleteRequest.setUnitPrice(BigDecimal.ZERO);
					deleteRequest.setTransStatus("S2"); // 출고완료
					deleteRequest.setItemIdx(inventory.getItemIdx());
					deleteRequest.setUserIdx(1L); // TODO: 실제 로그인한 사용자 ID로 변경
					deleteRequest.setCustIdx(1L); // 기본 거래처 ID
					deleteRequest.setRemark("재고 삭제");

					invTransactionService.insertTransaction(deleteRequest);
					successCount++;

				} catch (Exception e) {
					// 개별 아이템 실패는 로그로 남기고 계속 진행
					String errorMsg = String.format("품목 '%s' (재고ID: %d) 삭제 실패: %s", 
						inventory.getItemNm(), inventory.getInvIdx(), e.getMessage());
					errorMessages.append(errorMsg).append("\n");
				}
			}

			// 결과 메시지 생성
			if (successCount == totalCount) {
				return String.format("%d개의 재고가 성공적으로 삭제되었습니다.", successCount);
			} else if (successCount > 0) {
				return String.format("재고 삭제 부분 완료: %d/%d건 성공\n실패 내역:\n%s", 
					successCount, totalCount, errorMessages.toString());
			} else {
				throw new RuntimeException("모든 재고 삭제에 실패했습니다:\n" + errorMessages.toString());
			}

		} catch (Exception e) {
			throw new RuntimeException("재고 삭제 처리 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	/**
	 * 모든 창고 목록을 페이징으로 조회합니다. (정렬 및 검색 지원)
	 * @param page 페이지 번호 (1부터 시작)
	 * @param size 페이지 크기
	 * @param sortBy 정렬 기준 컬럼명
	 * @param sortDirection 정렬 방향 (asc/desc)
	 * @param keyword 검색어
	 * @return 페이징된 창고 DTO 목록 (담당자 이름 포함)
	 */
	@Transactional(readOnly = true)
	public PageDto<WhmstDto> findAllWarehouses(int page, int size, String sortBy, String sortDirection, String keyword) {
		// 1-based page를 0-based로 변환
		Pageable pageable = PageRequest.of(page - 1, size, createSort(sortBy, sortDirection));

		// 페이징된 엔티티 조회
		Page<Whmst> warehousePage = whmstRepository.findAllWarehousesWithUserDetailsPageable(keyword, pageable);

		// 엔티티를 DTO로 변환
		List<WhmstDto> warehouseDtos = warehousePage.getContent().stream()
			.map(this::convertToDto)
			.collect(Collectors.toList());

		return new PageDto<>(warehousePage, warehouseDtos);
	}

	/**
	 * 특정 창고를 ID로 조회합니다.
	 * @param whIdx 창고 고유 번호
	 * @return 조회된 창고 정보 DTO (존재하지 않으면 null)
	 */
	@Transactional(readOnly = true)
	public WhmstDto getWhmstById(Long whIdx) {
		return whmstRepository.findWarehouseDetailsById(whIdx);
	}

	/**
	 * 신규 창고를 등록합니다.
	 * @param whmstDto 등록할 창고 정보 DTO (담당자 인덱스 포함)
	 * @return 등록된 창고 정보 DTO (담당자 이름 포함)
	 */
	@Transactional
	public WhmstDto createWhmst(WhmstDto whmstDto) {
		Whmst whmst = new Whmst();
		whmst.setWhNm(whmstDto.getWhNm());
		whmst.setRemark(whmstDto.getRemark());
		whmst.setWhType1(whmstDto.getWhType1() != null ? whmstDto.getWhType1() : "N");
		whmst.setWhType2(whmstDto.getWhType2() != null ? whmstDto.getWhType2() : "N");
		whmst.setWhType3(whmstDto.getWhType3() != null ? whmstDto.getWhType3() : "N");
		whmst.setUseFlag(whmstDto.getUseFlag() != null ? whmstDto.getUseFlag() : "Y");
		whmst.setWhLocation(whmstDto.getWhLocation());

		if (whmstDto.getWhUserIdx() != null) {
			Usermst user = usermstRepository.findById(whmstDto.getWhUserIdx())
				.orElseThrow(() -> new NoSuchElementException("담당 사용자를 찾을 수 없습니다: " + whmstDto.getWhUserIdx()));
			whmst.setWhUser(user);
		} else {
			whmst.setWhUser(null);
		}

		Whmst savedWhmst = whmstRepository.save(whmst);
		return whmstRepository.findWarehouseDetailsById(savedWhmst.getWhIdx());
	}

	/**
	 * 기존 창고 정보를 수정합니다.
	 * @param whIdx 수정할 창고의 고유 번호
	 * @param updatedWhmstDto 업데이트할 창고 정보 DTO (담당자 인덱스 포함)
	 * @return 업데이트된 창고 정보 DTO (담당자 이름 포함)
	 */
	@Transactional
	public WhmstDto updateWhmst(Long whIdx, WhmstDto updatedWhmstDto) {
		Whmst existingWhmst = whmstRepository.findById(whIdx)
			.orElseThrow(() -> new NoSuchElementException("창고를 찾을 수 없습니다: " + whIdx));

		existingWhmst.setWhNm(updatedWhmstDto.getWhNm());
		existingWhmst.setRemark(updatedWhmstDto.getRemark());
		existingWhmst.setWhType1(updatedWhmstDto.getWhType1() != null ? updatedWhmstDto.getWhType1() : "N");
		existingWhmst.setWhType2(updatedWhmstDto.getWhType2() != null ? updatedWhmstDto.getWhType2() : "N");
		existingWhmst.setWhType3(updatedWhmstDto.getWhType3() != null ? updatedWhmstDto.getWhType3() : "N");
		existingWhmst.setUseFlag(updatedWhmstDto.getUseFlag() != null ? updatedWhmstDto.getUseFlag() : "Y");
		existingWhmst.setWhLocation(updatedWhmstDto.getWhLocation());

		if (updatedWhmstDto.getWhUserIdx() != null) {
			Usermst user = usermstRepository.findById(updatedWhmstDto.getWhUserIdx())
				.orElseThrow(() -> new NoSuchElementException("담당 사용자를 찾을 수 없습니다: " + updatedWhmstDto.getWhUserIdx()));
			existingWhmst.setWhUser(user);
		} else {
			existingWhmst.setWhUser(null);
		}

		Whmst savedWhmst = whmstRepository.save(existingWhmst);
		return whmstRepository.findWarehouseDetailsById(savedWhmst.getWhIdx());
	}

	/**
	 * 선택된 창고들을 삭제합니다.
	 * @param whIdxes 삭제할 창고 고유 번호 목록
	 */
	@Transactional
	public void deleteWhmsts(List<Long> whIdxes) {
		whmstRepository.deleteAllById(whIdxes);
	}

	/**
	 * 활성 상태인 사용자 목록을 조회합니다. (담당자 드롭다운용)
	 * @return 활성 사용자 Entity 목록
	 */
	@Transactional(readOnly = true)
	public List<Usermst> getActiveUsersForSelection() {
		return usermstRepository.findByUserStatus("01"); // '01'이 활성 상태 코드라고 가정
	}

	/**
	 * 특정 창고의 상세 재고 정보를 조회합니다.
	 * @param whIdx 창고 고유 번호
	 * @return 해당 창고의 재고 상세 정보 DTO 목록 (재고 수량 > 0)
	 */
	@Transactional(readOnly = true)
	public List<WarehouseInventoryDetailDto> getWarehouseInventoryDetailsByWhIdx(Long whIdx) {
		return warehouseInventoryDetailViewRepository.findByWhIdx(whIdx).stream()
			.map(this::convertToWarehouseInventoryDetailDto)
			.filter(dto -> dto != null) // null 체크
			.filter(dto -> dto.getStockQty() != null && dto.getStockQty().compareTo(BigDecimal.ZERO) > 0) // 재고 수량 > 0 필터링
			.collect(Collectors.toList());
	}

	/**
	 * 특정 창고의 상세 재고 정보를 창고 코드로 조회합니다.
	 * @param whCd 창고 코드
	 * @return 해당 창고의 재고 상세 정보 DTO 목록 (재고 수량 > 0)
	 */
	@Transactional(readOnly = true)
	public List<WarehouseInventoryDetailDto> getWarehouseInventoryDetailsByWhCd(String whCd) {
		return warehouseInventoryDetailViewRepository.findByWhCd(whCd).stream()
			.map(this::convertToWarehouseInventoryDetailDto)
			.filter(dto -> dto != null) // null 체크
			.filter(dto -> dto.getStockQty() != null && dto.getStockQty().compareTo(BigDecimal.ZERO) > 0) // 재고 수량 > 0 필터링
			.collect(Collectors.toList());
	}

	/**
	 * 모든 창고의 상세 재고 정보를 조회합니다.
	 * @return 모든 창고의 재고 상세 정보 DTO 목록 (재고 수량 > 0)
	 */
	@Transactional(readOnly = true)
	public List<WarehouseInventoryDetailDto> getAllWarehouseInventoryDetails() {
		return warehouseInventoryDetailViewRepository.findAll().stream()
			.map(this::convertToWarehouseInventoryDetailDto)
			.filter(dto -> dto != null) // null 체크
			.filter(dto -> dto.getStockQty() != null && dto.getStockQty().compareTo(BigDecimal.ZERO) > 0) // 재고 수량 > 0 필터링
			.collect(Collectors.toList());
	}

	/**
	 * Datalist에 사용될 활성 상태의 창고 목록을 조회합니다.
	 * @return 활성 창고 DTO 목록
	 */
	@Transactional(readOnly = true)
	public List<WhmstDto> findActiveWarehousesForSelection() {
		Sort defaultSort = Sort.by(Sort.Direction.ASC, "whNm"); // 창고명 오름차순 정렬

		List<WhmstDto> activeWarehouseDtos = whmstRepository.findActiveWarehouseDtosByUseFlag("Y", defaultSort);

		if (activeWarehouseDtos == null) {
			return List.of(); // 리포지토리 결과가 null일 경우 빈 리스트 반환
		}

		return activeWarehouseDtos;
	}

	/**
	 * 선택된 창고들의 상세 정보를 포함하는 엑셀 파일을 생성합니다.
	 * @param warehouseIds 엑셀로 내보낼 창고 ID 목록
	 * @return 생성된 엑셀 파일의 ByteArrayOutputStream
	 * @throws IOException 엑셀 생성 중 오류 발생 시
	 */
	@Transactional(readOnly = true)
	public ByteArrayOutputStream generateWarehousesExcel(List<Long> warehouseIds) throws IOException {
		Workbook workbook = new XSSFWorkbook();
		Sheet sheet = workbook.createSheet("창고 상세 정보");

		// 헤더 스타일 설정
		CellStyle headerStyle = workbook.createCellStyle();
		Font headerFont = workbook.createFont();
		headerFont.setBold(true);
		headerStyle.setFont(headerFont);
		headerStyle.setAlignment(HorizontalAlignment.CENTER);
		headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
		headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
		headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
		headerStyle.setBorderBottom(BorderStyle.THIN);
		headerStyle.setBorderTop(BorderStyle.THIN);
		headerStyle.setBorderLeft(BorderStyle.THIN);
		headerStyle.setBorderRight(BorderStyle.THIN);

		// 데이터 셀 스타일 설정
		CellStyle dataStyle = workbook.createCellStyle();
		dataStyle.setBorderBottom(BorderStyle.THIN);
		dataStyle.setBorderTop(BorderStyle.THIN);
		dataStyle.setBorderLeft(BorderStyle.THIN);
		dataStyle.setBorderRight(BorderStyle.THIN);
		dataStyle.setAlignment(HorizontalAlignment.LEFT);
		dataStyle.setVerticalAlignment(VerticalAlignment.TOP);
		dataStyle.setWrapText(true); // 셀 너비에 맞춰 텍스트 자동 줄바꿈

		// 엑셀 헤더 생성
		String[] headers = { "창고 코드", "창고명", "창고 타입", "사용 여부", "주소", "비고", "담당자" };
		Row headerRow = sheet.createRow(0);
		for (int i = 0; i < headers.length; i++) {
			Cell cell = headerRow.createCell(i);
			cell.setCellValue(headers[i]);
			cell.setCellStyle(headerStyle);
		}

		// 데이터 추가
		int rowNum = 1;
		for (Long whIdx : warehouseIds) {
			WhmstDto warehouse = whmstRepository.findWarehouseDetailsById(whIdx);
			if (warehouse != null) {
				Row dataRow = sheet.createRow(rowNum++);

				// 창고 타입 문자열 조합
				StringBuilder whType = new StringBuilder();
				if ("Y".equals(warehouse.getWhType1()))
					whType.append("자재 ");
				if ("Y".equals(warehouse.getWhType2()))
					whType.append("제품 ");
				if ("Y".equals(warehouse.getWhType3()))
					whType.append("반품 ");
				String whTypeStr = whType.toString().trim();

				dataRow.createCell(0).setCellValue(warehouse.getWhCd());
				dataRow.createCell(1).setCellValue(warehouse.getWhNm());
				dataRow.createCell(2).setCellValue(whTypeStr);
				dataRow.createCell(3).setCellValue("Y".equals(warehouse.getUseFlag()) ? "사용" : "미사용");
				dataRow.createCell(4).setCellValue(warehouse.getWhLocation());
				dataRow.createCell(5).setCellValue(warehouse.getRemark());
				dataRow.createCell(6).setCellValue(warehouse.getWhUserNm());

				// 모든 셀에 데이터 스타일 적용
				for (int i = 0; i < headers.length; i++) {
					if (dataRow.getCell(i) != null) {
						dataRow.getCell(i).setCellStyle(dataStyle);
					}
				}
			}
		}

		// 컬럼 너비 자동 조정
		for (int i = 0; i < headers.length; i++) {
			sheet.autoSizeColumn(i);
		}

		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		workbook.write(bos);
		workbook.close();

		return bos;
	}

	// ===== Private Helper Methods =====

	/**
	 * WarehouseInventoryDetailView 엔티티를 WarehouseInventoryDetailDto로 변환합니다.
	 */
	private WarehouseInventoryDetailDto convertToWarehouseInventoryDetailDto(WarehouseInventoryDetailView view) {
		if (view == null) {
			return null;
		}

		return WarehouseInventoryDetailDto.builder()
			// Warehouse Info
			.whIdx(view.getWhIdx()).whCd(view.getWhCd()).whNm(view.getWhNm()).whRemark(view.getWhRemark())
			.whType1(view.getWhType1()).whType2(view.getWhType2()).whType3(view.getWhType3())
			.useFlag(view.getUseFlag()).whLocation(view.getWhLocation())
			// Warehouse User Info
			.whUserId(view.getWhUserId()).whUserNm(view.getWhUserNm()).whUserEmail(view.getWhUserEmail())
			.whUserTel(view.getWhUserTel()).whUserHp(view.getWhUserHp()).whUserDept(view.getWhUserDept())
			.whUserPosition(view.getWhUserPosition())
			// Inventory Info
			.invIdx(view.getInvIdx()).stockQty(view.getStockQty()).invCreatedDate(view.getInvCreatedDate())
			.invUpdatedDate(view.getInvUpdatedDate())
			// Item Info
			.itemIdx(view.getItemIdx()).itemCd(view.getItemCd()).itemNm(view.getItemNm())
			.itemFlag(view.getItemFlag()).itemSpec(view.getItemSpec()).itemCost(view.getItemCost())
			.optimalInv(view.getOptimalInv()).cycleTime(view.getCycleTime()).itemRemark(view.getItemRemark())
			// Item Category Info
			.itemCat1Cd(view.getItemCat1Cd()).itemCat1Nm(view.getItemCat1Nm()).itemCat2Cd(view.getItemCat2Cd())
			.itemCat2Nm(view.getItemCat2Nm())
			// Item Unit Info
			.itemUnitNm(view.getItemUnitNm())
			// Item Customer Info
			.itemCustCd(view.getItemCustCd()).itemCustNm(view.getItemCustNm())
			.build();
	}

	/**
	 * Sort 객체를 생성합니다.
	 */
	private Sort createSort(String sortBy, String sortDirection) {
		Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
		String entityField = mapSortFieldToEntityField(sortBy);
		return Sort.by(direction, entityField);
	}

	/**
	 * 클라이언트에서 전달받은 정렬 필드명을 엔티티 필드명으로 매핑합니다.
	 */
	private String mapSortFieldToEntityField(String sortBy) {
		switch (sortBy) {
		case "whIdx":
			return "whIdx";
		case "whCd":
			return "whCd";
		case "whNm":
			return "whNm";
		case "whType1":
			return "whType1";
		case "useFlag":
			return "useFlag";
		case "whLocation":
			return "whLocation";
		case "remark":
			return "remark";
		case "whUserNm":
			return "whUser.userNm"; // 연관관계 필드
		default:
			return "whIdx"; // 기본값
		}
	}

	/**
	 * Whmst 엔티티를 WhmstDto로 변환합니다.
	 */
	private WhmstDto convertToDto(Whmst whmst) {
		WhmstDto dto = new WhmstDto();
		dto.setWhIdx(whmst.getWhIdx());
		dto.setWhCd(whmst.getWhCd());
		dto.setWhNm(whmst.getWhNm());
		dto.setRemark(whmst.getRemark());
		dto.setWhType1(whmst.getWhType1());
		dto.setWhType2(whmst.getWhType2());
		dto.setWhType3(whmst.getWhType3());
		dto.setUseFlag(whmst.getUseFlag());
		dto.setWhLocation(whmst.getWhLocation());

		// 담당자 정보 설정
		if (whmst.getWhUser() != null) {
			dto.setWhUserIdx(whmst.getWhUser().getUserIdx());
			dto.setWhUserNm(whmst.getWhUser().getUserNm());
			dto.setWhUserId(whmst.getWhUser().getUserId());
		}

		return dto;
	}
}