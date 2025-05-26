package kr.co.d_erp.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.dtos.Item;
import kr.co.d_erp.dtos.ItemForSelectionDto;
import kr.co.d_erp.mappers.ItemMapper;

@Service
public class ItemService {

	@Autowired
	private final ItemMapper itemMapper;

	@Autowired
	public ItemService(ItemMapper itemMapper) {
		this.itemMapper = itemMapper;

	}

	// 삭제
	public void deleteItems(List<Integer> itemIdx) {
		itemMapper.deleteItems(itemIdx);
	}

	// 엑셀 다운로드
	public byte[] createExcelFile(String CsearchCat, String CsearchItem) throws IOException {
		// getSearchItem 메서드를 호출하되, pageable 파라미터를 null로 전달
		List<Item> items = itemMapper.getSearchItem(CsearchCat, CsearchItem, null); // <-- 이 부분 변경

		Workbook workbook = new XSSFWorkbook();
		Sheet sheet = workbook.createSheet("품목 리스트");

		// 헤더 생성 및 데이터 채우는 로직은 이전과 동일
		String[] headers = { "품목 코드", "품목명", "대분류", "소분류", "거래처명", "단위", "수량", "품목원가", "규격", "비고" };
		Row headerRow = sheet.createRow(0);
		for (int i = 0; i < headers.length; i++) {
			Cell cell = headerRow.createCell(i);
			cell.setCellValue(headers[i]);
			CellStyle headerStyle = workbook.createCellStyle();
			Font headerFont = workbook.createFont();
			headerFont.setBold(true);
			headerStyle.setFont(headerFont);
			cell.setCellStyle(headerStyle);
		}

		int rowNum = 1;
		for (Item item : items) {
			Row row = sheet.createRow(rowNum++);
			row.createCell(0).setCellValue(item.getITEM_CD());
			row.createCell(1).setCellValue(item.getITEM_NM());
			row.createCell(2).setCellValue(item.getITEM_CATX1());
			row.createCell(3).setCellValue(item.getITEM_CATX2());
			row.createCell(4).setCellValue(item.getCUST_NM());
			row.createCell(5).setCellValue(item.getUNIT_NM());
			row.createCell(6).setCellValue(item.getQTY());
			row.createCell(7).setCellValue(item.getITEM_COST());
			row.createCell(8).setCellValue(item.getITEM_SPEC());
			row.createCell(9).setCellValue(item.getREMARK());
		}

		for (int i = 0; i < headers.length; i++) {
			sheet.autoSizeColumn(i);
		}

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		workbook.write(outputStream);
		workbook.close();

		return outputStream.toByteArray();
	}

	// 검색 리스트
	public List<Item> getSearchItem(Pageable pageable, String CsearchCat, String CsearchItem) {

		return itemMapper.getSearchItem(CsearchCat, CsearchItem, pageable); // MyBatis 또는 JPA에 따라 다름
	}

	// 검색 데이터 갯수
	public long getTotalSearchItemCount(String CsearchCat, String CsearchItem) {
		return itemMapper.getTotalSearchItemCount(CsearchCat, CsearchItem);
	}

	// 품목 리스트 출력
	public List<Item> getAllItem() {
		return itemMapper.selectALLItem();
	}

	// 품목 데이터 페이징
	public List<Item> getPagingItem(Pageable pageable) {
		int offset = pageable.getPageNumber() * pageable.getPageSize();
		int pageSize = pageable.getPageSize();
		return itemMapper.selectPagingItem(offset, pageSize);
	}

	// 품목 데이터 갯수
	public long getTotalItemCount() {
		return itemMapper.selectCountItem();
	}

	// 품목 리스트 조회 조건
	public Item getItemById(int item_IDX) {
		// ItemMapper에 해당 ID로 품목을 조회하는 메서드가 필요합니다.
		return itemMapper.selectItemById(item_IDX);
	}

	public void updateItem(Item item) {
		// ItemMapper에 품목 정보를 업데이트하는 메서드가 필요합니다.

		if (item.getCUST_NM() != null && !item.getCUST_NM().trim().isEmpty()) {
			String newCustNmToUpdate = item.getCUST_NM().trim();
			int existingCustIdx = item.getCUST_IDX();
			int updatedRows = itemMapper.updateCustNmByCustIdx(existingCustIdx, newCustNmToUpdate);
		}
		itemMapper.updateItem(item);
	}

	// 거래처 목록 조회
	public List<Item> selectALLCust() {
		return itemMapper.selectALLCust();
	}

	// 대분류 조회
	public List<Item> selectALLcat1() {
		return itemMapper.selectALLcat1();
	}

	// 소분류 조회
	public List<Item> findALLcat2(int PARENT_IDX) {
		return itemMapper.findALLcat2(PARENT_IDX);
	}

	// 단위 조회
	public List<Item> selectUnits() {
		return itemMapper.selectUnits();
	}

	// 품목 코드 중복 조회
	public boolean itemCdUnique(String itemCd) {

		return itemMapper.countCdItem(itemCd) == 0;
	}

	// 신규품목 등록 메소드
	@Transactional
	public void insertItem(Item item) {
		if (itemMapper.countCdItem(item.getITEM_CD().trim()) > 0) {
			throw new IllegalArgumentException("품목 코드 '" + item.getITEM_CD() + "'는 사용중입니다.");
		}

		if (item.getCUST_IDX() == null || item.getCUST_IDX() < 0) { // CUST_IDX가 유효하지 않은 경우

			item.setCUST_IDX(0);
		}
		if (item.getITEM_CATX1() != null && !item.getITEM_CATX1().trim().isEmpty()) {
			try {
				Integer parentCatIdx = Integer.parseInt(item.getITEM_CATX1().trim()); // 문자열을 숫자로 변환
				// 선택 사항: 만약 이 parentCatIdx가 TB_ITEM_CAT에 실제로 존재하는지 서비스 단에서 재확인하고 싶다면 여기에 추가
				// (이미 프론트 드롭다운에서 유효한 값만 선택 가능하게 했다면 굳이 다시 DB 조회할 필요는 없습니다.)
				item.setITEM_CAT1(parentCatIdx);
			} catch (NumberFormatException e) {
				// 숫자로 변환할 수 없는 경우의 예외 처리
				throw new IllegalArgumentException("유효하지 않은 대분류 ID 형식입니다: " + item.getITEM_CATX1());
			}
		} else {
			item.setITEM_CAT1(0); // 대분류가 없으면 0으로 설정 (필수 입력이면 이 로직은 불필요)
		}
		// 4. 소분류명(ITEM_CATX2) 처리 -> ITEM_CAT2 설정
		// 대분류가 설정되어 있고, 소분류명이 있을 때만 처리
		if (item.getITEM_CATX2() != null && !item.getITEM_CATX2().trim().isEmpty() && item.getITEM_CAT1() != 0) {
			try {
				Integer childCatIdx = Integer.parseInt(item.getITEM_CATX2().trim()); // 문자열을 숫자로 변환
				// 선택 사항: 해당 대분류의 자식인지, DB에 존재하는지 서비스 단에서 재확인하고 싶다면 여기에 추가
				// (프론트 드롭다운 로직이 정확하다면 이 과정도 불필요할 수 있습니다.)
				item.setITEM_CAT2(childCatIdx);
			} catch (NumberFormatException e) {
				// 숫자로 변환할 수 없는 경우의 예외 처리
				throw new IllegalArgumentException("유효하지 않은 소분류 ID 형식입니다: " + item.getITEM_CATX2());
			}
		} else {
			item.setITEM_CAT2(0); // 소분류가 없으면 0으로 설정
		}
		itemMapper.insertItem(item);
	}

	//입출고페이지에서 품목리스트 출력하는 메소드 
	@Transactional(readOnly = true) // 읽기 전용 트랜잭션 설정
	public List<ItemForSelectionDto> findActiveItemsForSelection() {
		// 현재는 모든 품목을 가져오도록 selectALLItem()을 사용합니다.
		// "활성" 품목만 선택해야 하는 경우, ItemMapper에 해당 조건에 맞는 메소드를 추가하거나
		// 여기서 추가적인 필터링 로직을 구현해야 합니다.
		List<Item> allItems = itemMapper.selectALLItem();

		if (allItems == null) {
			return List.of(); // 비어있는 리스트 반환
		}

		return allItems.stream().map(item -> {
			Long itemIdxAsLong = null;
			if (item.getITEM_IDX() != null) { // getITEM_IDX()가 Integer를 반환한다고 가정
				itemIdxAsLong = Long.valueOf(item.getITEM_IDX());
			}
//			return new ItemForSelectionDto(itemIdxAsLong, item.getITEM_NM(), item.getITEM_CD(), item.getCYCLE_TIME(), item.getITEM_COST()); // cycleTime, itemCost 필요해서 추가했습니다 문제 생기면 삭제해주세요. -민섭
			return new ItemForSelectionDto(itemIdxAsLong, item.getITEM_NM(), item.getITEM_CD(), item.getCYCLE_TIME(), item.getITEM_COST()); // cycleTime, itemCost 필요해서 추가했습니다 문제 생기면 삭제해주세요. -민섭
		}).collect(Collectors.toList());
	}
	
	
}