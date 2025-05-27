package kr.co.d_erp.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page; // 이 import가 중요합니다.

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PageDto<T> { // T는 content 리스트의 DTO 타입을 나타냅니다.
    private List<T> content;
    private int currentPage;    // 클라이언트에게 전달 시 1-based
    private long totalElements;
    private int totalPages;
    private int size;           // 페이지 크기

    /**
     * Spring Data JPA의 Page 객체와 변환된 DTO 리스트를 받아 PageDto를 생성합니다.
     * @param pageResult Page 객체 (페이지네이션 메타데이터 제공용, 예: Page<VInvTransactionDetails>)
     * @param dtoList 변환된 DTO 리스트 (예: List<VInvTransactionDetailsDto>)
     */
    public PageDto(Page<?> pageResult, List<T> dtoList) { // 첫 번째 인자를 Page<?>로 변경
        this.content = dtoList;
        this.currentPage = pageResult.getNumber() + 1; // Spring Page는 0-based이므로 +1
        this.totalElements = pageResult.getTotalElements();
        this.totalPages = pageResult.getTotalPages();
        this.size = pageResult.getSize();
    }

    // 모든 필드를 직접 받는 생성자 (선택 사항)
    public PageDto(List<T> content, int currentPage, long totalElements, int totalPages, int size) {
        this.content = content;
        this.currentPage = currentPage;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.size = size;
    }
}