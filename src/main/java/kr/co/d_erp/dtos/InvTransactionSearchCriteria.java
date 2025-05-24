package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

//입출고 검색 조건을 담음 
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InvTransactionSearchCriteria {
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate transDateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate transDateTo;

    private Long itemIdx;
    private Long custIdx;
    private Long userIdx;
    private Long whIdx;
    private String transStatus;
    private String transType; // 'R' 또는 'S'
}