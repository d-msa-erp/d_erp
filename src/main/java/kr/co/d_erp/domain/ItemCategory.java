package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
@Entity
@Table(name = "TB_ITEM_CAT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemCategory {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY) // Oracle의 경우 GenerationType.IDENTITY 또는 SEQUENCE 전략 사용
 @Column(name = "CAT_IDX", nullable = false)
 private Long catIdx; // 분류 고유 번호 (기본 키)

 @Column(name = "CAT_CD", length = 20, nullable = false, unique = true)
 private String catCd; // 분류 코드 (고유)

 @Column(name = "CAT_NM", length = 50, nullable = false)
 private String catNm; // 분류명

 // 부모-자식 관계 (재귀 참조)
 @ManyToOne(fetch = FetchType.LAZY) // 부모는 하나, 여러 자식이 하나의 부모를 가질 수 있음
 @JoinColumn(name = "PARENT_IDX", referencedColumnName = "CAT_IDX") // 부모 분류 고유 번호
 private ItemCategory parentCategory;

 @OneToMany(mappedBy = "parentCategory", cascade = CascadeType.ALL, orphanRemoval = true)
 private List<ItemCategory> childCategories = new ArrayList<>(); // 자식 분류 리스트

 @Column(name = "REMARK", length = 100)
 private String remark; // 비고 (NULL 허용)

 // 편의 메서드: 자식 카테고리 추가
 public void addChildCategory(ItemCategory child) {
     this.childCategories.add(child);
     child.setParentCategory(this); // 자식에게 부모 설정
 }
}
