package kr.co.d_erp.dtos;

public interface WhmstDto { // ⭐ class 대신 interface로 변경 ⭐

    Long getWhIdx();
    String getWhCd();
    String getWhNm();
    String getRemark();
    String getWhType1();
    String getWhType2();
    String getWhType3();
    String getUseFlag();
    String getWhLocation();
    Long getWhUserIdx();
    String getWhUserNm(); // Getter 메서드 정의
    String getWhUserId(); // Getter 메서드 정의

    // 필요하다면 setter 대신 Builder 패턴을 사용하는 DTO 클래스를 별도로 두거나,
    // 생성/수정용 DTO를 따로 정의하는 것이 좋습니다.
    // 현재는 이 인터페이스는 조회(read) 목적으로만 사용합니다.
}