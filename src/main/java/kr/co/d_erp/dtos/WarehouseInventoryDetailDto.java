package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder; // Builder 패턴 추가
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime; // Java 8 날짜/시간 API 사용

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder // Builder 패턴 추가
public class WarehouseInventoryDetailDto {

    // Warehouse Info
    private Long whIdx;
    private String whCd;
    private String whNm;
    private String whRemark;
    private String whType1;
    private String whType2;
    private String whType3;
    private String useFlag;
    private String whLocation;

    // Warehouse User Info (Optional, can be null)
    private String whUserId;
    private String whUserNm; // Usermst.userNm
    private String whUserEmail;
    private String whUserTel;
    private String whUserHp;
    private String whUserDept;
    private String whUserPosition;

    // Inventory Info (Optional, can be null if no stock for a warehouse)
    private Long invIdx;
    private BigDecimal stockQty;
    private LocalDateTime invCreatedDate;
    private LocalDateTime invUpdatedDate;

    // Item Info (Optional, can be null if no stock)
    private Long itemIdx;
    private String itemCd;
    private String itemNm;
    private String itemFlag;
    private String itemSpec;
    private Double itemCost; // NUMBER는 Double로 매핑
    private Double optimalInv; // NUMBER(12,2)도 Double로 매핑 가능
    private Double cycleTime; // NUMBER(10,4)도 Double로 매핑 가능
    private String itemRemark;

    // Item Category Info (Optional, can be null if no stock)
    private String itemCat1Cd;
    private String itemCat1Nm;
    private String itemCat2Cd;
    private String itemCat2Nm;

    // Item Unit Info (Optional, can be null if no stock)
    private String itemUnitNm;

    // Item Customer Info (Optional, can be null if no stock)
    private String itemCustCd;
    private String itemCustNm;
}