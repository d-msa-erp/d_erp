package kr.co.d_erp.service;

import kr.co.d_erp.domain.Usermst; // Usermst 엔티티 import
import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.WhmstDto; // WhmstDto 클래스 import
import kr.co.d_erp.repository.oracle.UsermstRepository; // UsermstRepository import
import kr.co.d_erp.repository.oracle.WhmstRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class WhmstService {

    private final WhmstRepository whmstRepository;
    private final UsermstRepository usermstRepository; // ⭐ 변수명 소문자로 변경 ⭐

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

        // ⭐ 변경: DTO의 whUserIdx로 Usermst 엔티티를 찾아 Whmst 엔티티의 whUser 필드에 설정 ⭐
        if (whmstDto.getWhUserIdx() != null) {
            Usermst user = usermstRepository.findById(whmstDto.getWhUserIdx())
                                            .orElseThrow(() -> new NoSuchElementException("담당 사용자를 찾을 수 없습니다: " + whmstDto.getWhUserIdx()));
            whmst.setWhUser(user); // Usermst 엔티티 객체를 Whmst 엔티티에 설정
        } else {
            whmst.setWhUser(null); // 담당자가 없는 경우
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

        // ⭐ 변경: DTO의 whUserIdx로 Usermst 엔티티를 찾아 Whmst 엔티티의 whUser 필드에 설정 ⭐
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
        // Usermst 엔티티의 userStatus 필드를 기준으로 조회
        return usermstRepository.findByUserStatus("01"); // '01'이 활성 상태 코드라고 가정
    }
}