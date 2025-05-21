package kr.co.d_erp.service;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.Usermst;
import kr.co.d_erp.dtos.WhmstDto; // WhmstDto가 인터페이스임을 인지
import kr.co.d_erp.repository.oracle.UsermstRepository;
import kr.co.d_erp.repository.oracle.WhmstRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException; // 추가

@Service
@RequiredArgsConstructor
public class WhmstService {

    private final WhmstRepository whmstRepository;
    private final UsermstRepository UsermstRepository;

    /**
     * 모든 창고 목록을 조회합니다. (정렬 및 검색 지원)
     * WhmstDto 리스트를 반환하며, 담당자 이름이 포함됩니다.
     * @param sortBy 정렬 기준 컬럼명
     * @param sortDirection 정렬 방향 (asc/desc)
     * @param keyword 검색어
     * @return 창고 DTO 목록 (담당자 이름 포함)
     */
    @Transactional(readOnly = true)
    public List<WhmstDto> findAllWarehouses(String sortBy, String sortDirection, String keyword) {
        // WhmstRepository의 커스텀 쿼리 호출: 이 메서드는 이미 whUserNm을 포함한 DTO (인터페이스)를 반환합니다.
        return whmstRepository.findAllWarehousesWithUserDetails(sortBy, sortDirection, keyword);
    }

    /**
     * 특정 창고를 ID로 조회합니다.
     * 담당자 이름이 포함된 WhmstDto를 반환합니다.
     * @param whIdx 창고 고유 번호
     * @return 조회된 창고 정보 DTO (존재하지 않으면 null)
     */
    @Transactional(readOnly = true)
    public WhmstDto getWhmstById(Long whIdx) {
        // WhmstRepository의 커스텀 쿼리 호출: 이 메서드는 whUserNm을 포함한 DTO (인터페이스)를 반환합니다.
        // Optional<WhmstDto>가 아닌 WhmstDto를 직접 반환하도록 Repository 메서드 정의 (혹은 .orElse(null) 처리)
        // 현재 WhmstRepository의 findWarehouseDetailsById는 WhmstDto를 직접 반환하므로 .orElseThrow() 사용
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
        // WH_CD는 DB 트리거가 자동 생성하도록 맡깁니다.
        // whmst.setWhCd(whmstDto.getWhCd()); // 이 줄은 불필요

        // 인터페이스인 WhmstDto에서 값을 가져와 Whmst 엔티티에 설정
        whmst.setWhNm(whmstDto.getWhNm());
        whmst.setRemark(whmstDto.getRemark());
        whmst.setWhType1(whmstDto.getWhType1() != null ? whmstDto.getWhType1() : "N");
        whmst.setWhType2(whmstDto.getWhType2() != null ? whmstDto.getWhType2() : "N");
        whmst.setWhType3(whmstDto.getWhType3() != null ? whmstDto.getWhType3() : "N");
        whmst.setUseFlag(whmstDto.getUseFlag() != null ? whmstDto.getUseFlag() : "Y");
        whmst.setWhLocation(whmstDto.getWhLocation());
        whmst.setWhUserIdx(whmstDto.getWhUserIdx());

        Whmst savedWhmst = whmstRepository.save(whmst);

        // 등록 후에는 WH_CD가 DB 트리거에 의해 생성되었고, 담당자 이름도 포함된
        // 완전한 DTO를 반환하기 위해 findWarehouseDetailsById를 호출합니다.
        // 이 과정에서 DB에서 WH_CD와 WH_USER_NM이 제대로 조회됩니다.
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

        // WH_CD는 수정 불가하므로 설정하지 않습니다.
        existingWhmst.setWhNm(updatedWhmstDto.getWhNm());
        existingWhmst.setRemark(updatedWhmstDto.getRemark());
        existingWhmst.setWhType1(updatedWhmstDto.getWhType1() != null ? updatedWhmstDto.getWhType1() : "N");
        existingWhmst.setWhType2(updatedWhmstDto.getWhType2() != null ? updatedWhmstDto.getWhType2() : "N");
        existingWhmst.setWhType3(updatedWhmstDto.getWhType3() != null ? updatedWhmstDto.getWhType3() : "N");
        existingWhmst.setUseFlag(updatedWhmstDto.getUseFlag() != null ? updatedWhmstDto.getUseFlag() : "Y");
        existingWhmst.setWhLocation(updatedWhmstDto.getWhLocation());
        existingWhmst.setWhUserIdx(updatedWhmstDto.getWhUserIdx());

        Whmst savedWhmst = whmstRepository.save(existingWhmst);

        // 수정 후에는 뷰를 다시 조회하여 담당자 이름까지 포함된 완전한 DTO를 반환합니다.
        return whmstRepository.findWarehouseDetailsById(savedWhmst.getWhIdx());
    }

    /**
     * 선택된 창고들을 삭제합니다.
     * @param whIdxes 삭제할 창고 고유 번호 목록
     */
    @Transactional
    public void deleteWhmsts(List<Long> whIdxes) {
        // 실제 삭제 전에 유효성 검사 (예: 연관된 재고 데이터 확인 등)를 추가할 수 있습니다.
        whmstRepository.deleteAllById(whIdxes);
    }

    /**
     * 활성 상태인 사용자 목록을 조회합니다. (담당자 드롭다운용)
     * @return 활성 사용자 Entity 목록
     */
    @Transactional(readOnly = true)
    public List<Usermst> getActiveUsersForSelection() {
        // '01'이 활성 상태 코드라고 가정합니다.
        // UsermstRepository에 findByUserStatus 메서드가 있어야 합니다.
        return UsermstRepository.findByUserStatus("01");
    }

    // ⭐ 제거: WhmstDto가 인터페이스가 되었으므로 이 메서드는 더 이상 사용할 수 없습니다. ⭐
    // ⭐ 또한, Repository에서 DTO (Projection)를 직접 반환하므로 이 변환 로직이 필요 없습니다. ⭐
    /*
    private WhmstDto convertToDto(Whmst whmst) {
        WhmstDto dto = new WhmstDto(); // 인터페이스는 이렇게 인스턴스화할 수 없습니다.
        dto.setWhIdx(whmst.getWhIdx());
        dto.setWhCd(whmst.getWhCd());
        dto.setWhNm(whmst.getWhNm());
        dto.setRemark(whmst.getRemark());
        dto.setWhType1(whmst.getWhType1());
        dto.setWhType2(whmst.getWhType2());
        dto.setWhType3(whmst.getWhType3());
        dto.setUseFlag(whmst.getUseFlag());
        dto.setWhLocation(whmst.getWhLocation());
        dto.setWhUserIdx(whmst.getWhUserIdx());
        return dto;
    }
    */
}