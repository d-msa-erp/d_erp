package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 프론트엔드로 전송할 BOM 상세 정보 DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BomDetailDto {

	   // --- 상위 품목 (완제품) 정보 ---
    private String pitemCd;         // 상위 품목의 코드 (예: A001)
    private String pitemNm;         // 상위 품목의 이름 (예: 불고기 도시락)
    private String pitemFlag;       // 상위 품목의 유형 플래그 (예: '02' = 완제품)
    private String pUnitNm;         // 상위 품목의 단위명 (예: 개, 세트)
    private String pCustNm;         // 상위 품목을 담당하는 고객사명 (예: (주)한라식품)
    private Integer pCycleTime;     // 상위 품목의 생산에 걸리는 시간 (생산성, 예: 10분)

    // --- 하위 품목 (원자재) 정보 (※ 프론트엔드에서 직접 표시하지 않을 수 있지만, 백엔드 로직에 필요) ---
    private String sitemCd;         // 하위 품목의 코드 (예: R001)
    private String sitemNm;         // 하위 품목의 이름 (예: 소고기 등심)
    private String sitemFlag;       // 하위 품목의 유형 플래그 (예: '01' = 자재)
    private String sUnitNm;         // 하위 품목의 단위명 (예: kg, g)
    private String sCustNm;         // 하위 품목을 담당하는 고객사명 (예: (주)대한유통)

    // --- BOM 및 원가 관련 정보 ---
    private BigDecimal  bomUseQty;      // 특정 상위 품목 1개를 만드는 데 필요한 하위 품목의 소요량 (예: 불고기 도시락 1개당 소고기 등심 0.2kg)
    private BigDecimal sItemUnitPrice; // 하위 품목 1단위의 개별 단가 (예: 소고기 등심 1kg당 20000원)
    private BigDecimal sItemCalculatedCost; // **개별 하위 품목의 계산된 원가** (sItemUnitPrice * bomUseQty)
                                            // (예: 소고기 등심 0.2kg의 원가 = 20000 * 0.2 = 4000원)

    private BigDecimal pTotalRawMaterialCost; // **상위 품목(완제품)의 총 원자재 원가**
                                                // (해당 완제품을 구성하는 모든 하위 품목들의 sItemCalculatedCost 합산)
                                                // (예: 불고기 도시락의 총 원가 = 소고기 등심 원가 + 양파 원가 + ... )

    // --- 기타 정보 ---
    private String catNm;           // 하위 품목의 대분류명 (예: 육류, 채소)

    
    // 기본 생성자, 모든 필드 생성자, getter, setter 필요
    // Lombok으로 대체
}