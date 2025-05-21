package kr.co.d_erp.service;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.WhmstDto;
import kr.co.d_erp.repository.oracle.WhmstRepository; // 패키지 이름이 oracle로 되어 있다면 이대로 유지
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification; // Specification 사용을 위해 추가
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WhmstService {

    private final WhmstRepository whmstRepository;

    /**
     * 모든 창고 목록을 조회합니다. (정렬 및 검색 지원)
     * Entity 대신 DTO 리스트를 반환하도록 변경했습니다.
     * @param sortBy 정렬 기준 컬럼명
     * @param sortDirection 정렬 방향 (asc/desc)
     * @param keyword 검색어
     * @return 창고 DTO 목록
     */
    @Transactional(readOnly = true)
    public List<WhmstDto> findAllWarehouses(String sortBy, String sortDirection, String keyword) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Sort sort = Sort.by(direction, sortBy);

        // 검색 조건 (JpaSpecificationExecutor를 활용)
        Specification<Whmst> spec = (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return null; // 검색어 없으면 조건 없음
            }
            String lowerKeyword = keyword.toLowerCase();
            return cb.or(
                cb.like(cb.lower(root.get("whNm")), "%" + lowerKeyword + "%"),
                cb.like(cb.lower(root.get("whCd")), "%" + lowerKeyword + "%"),
                cb.like(cb.lower(root.get("whLocation")), "%" + lowerKeyword + "%"),
                cb.like(cb.lower(root.get("remark")), "%" + lowerKeyword + "%")
            );
        };

        List<Whmst> warehouses;
        if (keyword == null || keyword.trim().isEmpty()) {
             warehouses = whmstRepository.findAll(sort); // 키워드 없으면 전체 정렬만
        } else {
             warehouses = whmstRepository.findAll(spec, sort); // 키워드 있으면 검색 및 정렬
        }

        // Entity 리스트를 DTO 리스트로 변환하여 반환
        return warehouses.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 신규 창고를 등록합니다.
     * WH_CD는 DTO에서 받아오거나, 비어있을 경우 DB 트리거가 자동 생성합니다.
     * @param whmstDto 등록할 창고 정보 DTO
     * @return 등록된 창고 정보 DTO
     */
    @Transactional
    public WhmstDto createWhmst(WhmstDto whmstDto) {
        Whmst whmst = new Whmst();
        // WH_CD는 프론트에서 비워두면 DB 트리거가 자동 생성합니다.
        // Entity에서 insertable=false이므로, DTO에서 값이 넘어와도 JPA 쿼리에 포함되지 않습니다.
        whmst.setWhCd(whmstDto.getWhCd()); // DTO에서 비워두면 null이 설정될 것임

        whmst.setWhNm(whmstDto.getWhNm());
        whmst.setRemark(whmstDto.getRemark());
        whmst.setWhType1(whmstDto.getWhType1() != null ? whmstDto.getWhType1() : "N");
        whmst.setWhType2(whmstDto.getWhType2() != null ? whmstDto.getWhType2() : "N");
        whmst.setWhType3(whmstDto.getWhType3() != null ? whmstDto.getWhType3() : "N");
        whmst.setUseFlag(whmstDto.getUseFlag() != null ? whmstDto.getUseFlag() : "Y");
        whmst.setWhLocation(whmstDto.getWhLocation());

        // WH_USER_IDX 설정 (실제 로그인한 사용자의 ID로 변경 필요)
        whmst.setWhUserIdx(1L); // 현재는 임시값 1L 사용 (DB의 TB_USERMST에 USER_IDX=1 레코드가 있어야 함)

        Whmst savedWhmst = whmstRepository.save(whmst); // DB에 저장, 트리거가 WH_CD 생성

        return convertToDto(savedWhmst); // 저장된 정보를 DTO로 변환하여 반환
    }

    /**
     * 특정 창고를 ID로 조회합니다.
     * @param whIdx 창고 고유 번호
     * @return 조회된 창고 정보 DTO (존재하지 않으면 null)
     */
    @Transactional(readOnly = true)
    public WhmstDto getWhmstById(Long whIdx) {
        Optional<Whmst> whmstOptional = whmstRepository.findById(whIdx);
        return whmstOptional.map(this::convertToDto).orElse(null);
    }

    /**
     * Whmst Entity를 WhmstDto로 변환합니다.
     * @param whmst 변환할 Entity 객체
     * @return 변환된 DTO 객체
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
        return dto;
    }
}