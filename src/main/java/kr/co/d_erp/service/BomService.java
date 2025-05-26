package kr.co.d_erp.service;

import kr.co.d_erp.dtos.BomItemDetailDto;
import kr.co.d_erp.dtos.BomSaveRequestDto;
import kr.co.d_erp.dtos.BomSequenceUpdateDto;
import kr.co.d_erp.dtos.BomSummaryDto;
import kr.co.d_erp.dtos.BomUpdateRequestDto;
import kr.co.d_erp.dtos.ItemSelectionDto;

import java.util.List;

/**
 * BOM 관련 비즈니스 로직을 처리하는 서비스 인터페이스입니다.
 */
public interface BomService {

    /**
     * BOM 요약 목록 (제품 리스트)을 조회합니다.
     * @return BomSummaryDto 리스트
     */
    List<BomSummaryDto> getBomSummaryList();

    /**
     * 특정 상위 품목 ID를 기준으로 BOM 상세 정보를 조회합니다.
     */
    BomItemDetailDto getBomDetails(Long parentItemIdx);

    /**
     * 특정 BOM의 하위 품목 순서를 업데이트합니다.
     */
    boolean updateBomSequence(Long parentItemIdx, List<BomSequenceUpdateDto> sequenceUpdates);

    
    //ItemFlag로 구분 modal용
    List<ItemSelectionDto> getItemsForSelectionByFlag(String itemFlag);
    
    //업데이트용
    boolean updateBom(Long parentItemIdx, BomUpdateRequestDto bomUpdateRequestDto);
    
    //저장용
    boolean saveNewBom(BomSaveRequestDto bomSaveRequestDto);
    
}