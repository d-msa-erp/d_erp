package kr.co.d_erp.service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.UserSelectDto;
import kr.co.d_erp.models.PasswordHandler;
import kr.co.d_erp.repository.oracle.UsermstRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 주입
public class UsermstService {

    private final UsermstRepository userMstRepository;
    private final PasswordHandler passwordHandler; // 비밀번호 암호화 핸들러

    public List<Usermst> findAllUsers(String sortBy, String sortDirection, String keyword) {
        // 정렬 방향 (asc/desc) 문자열을 enum으로 변환
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        // sortBy 문자열로 정렬 객체 생성
        Sort sort = Sort.by(direction, sortBy);

        // keyword를 findAllUsersByKeyword 메서드로 전달
        // keyword가 null이거나 빈 문자열이면 @Query 내에서 모든 결과를 반환하도록 처리됨
        List<Usermst> users = userMstRepository.findAllUsersByKeyword(keyword, sort);
        
        // 각 사용자 엔티티에 PasswordHandler 주입
        users.forEach(user -> user.setPasswordHandler(passwordHandler));
        
        return users;
    }

    /**
     * 페이징을 지원하는 사용자 목록 조회
     * 
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @param sortBy 정렬 기준 필드
     * @param sortDirection 정렬 방향 (asc/desc)
     * @param keyword 검색 키워드
     * @return PageDto<Usermst>
     */
    public PageDto<Usermst> findAllUsersWithPaging(int page, int size, String sortBy, String sortDirection, String keyword) {
        // 정렬 방향 변환
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Sort sort = Sort.by(direction, sortBy);
        
        // Pageable 객체 생성
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // 페이징 조회
        Page<Usermst> pageResult = userMstRepository.findAllUsersByKeywordWithPaging(keyword, pageable);
        
        // 각 사용자 엔티티에 PasswordHandler 주입
        List<Usermst> users = pageResult.getContent();
        users.forEach(user -> user.setPasswordHandler(passwordHandler));
        
        // PageDto로 변환하여 반환
        return new PageDto<>(pageResult, users);
    }

    /**
     * 사용자 ID로 특정 사용자 조회
     * 
     * @param userIdx 사용자 고유 번호
     * @return Optional<Usermst>
     */
    @Transactional(readOnly = true)
    public Optional<Usermst> getUserByIdx(Long userIdx) {
        Optional<Usermst> userOpt = userMstRepository.findById(userIdx);
        
        // PasswordHandler 주입
        userOpt.ifPresent(user -> user.setPasswordHandler(passwordHandler));
        
        return userOpt;
    }

    /**
     * 사용자 ID로 특정 사용자 조회 (로그인용)
     * 
     * @param userId 사용자 ID
     * @return Optional<Usermst>
     */
    @Transactional(readOnly = true)
    public Optional<Usermst> getUserByUserId(String userId) {
        Optional<Usermst> userOpt = userMstRepository.findByUserId(userId);
        
        // PasswordHandler 주입
        userOpt.ifPresent(user -> user.setPasswordHandler(passwordHandler));
        
        return userOpt;
    }

    /**
     * 로그인 인증
     * 
     * @param userId 사용자 ID
     * @param rawPassword 평문 비밀번호
     * @return 인증 성공 여부
     */
    @Transactional(readOnly = true)
    public boolean authenticateUser(String userId, String rawPassword) {
        Optional<Usermst> userOpt = userMstRepository.findByUserId(userId);
        
        if (userOpt.isEmpty()) {
            return false;
        }
        
        Usermst user = userOpt.get();
        
        // 사용자 상태 확인 (활성 상태만 로그인 허용)
        if (!"01".equals(user.getUserStatus())) {
            return false;
        }
        
        // PasswordHandler 주입 후 비밀번호 검증
        user.setPasswordHandler(passwordHandler);
        return user.checkPassword(rawPassword);
    }

    /**
     * 퇴사일과 재직상태를 자동으로 처리하는 헬퍼 메서드
     * 
     * @param user 처리할 사용자 객체
     */
    private void handleRetirementLogic(Usermst user) {
        LocalDate today = LocalDate.now();
        
        // 1. 재직상태가 '02'(퇴사)로 변경되었을 때 퇴사일이 없으면 오늘 날짜로 설정
        if ("02".equals(user.getUserStatus()) && user.getRetireDt() == null) {
            user.setRetireDt(today);
            System.out.println("퇴사 상태 설정 - 퇴사일을 오늘 날짜로 자동 설정: " + user.getRetireDt());
        }
        
        // 2. 퇴사일이 입력되었을 때 오늘이거나 과거일인 경우에만 퇴사로 변경
        if (user.getRetireDt() != null) {
            if (user.getRetireDt().isBefore(today) || user.getRetireDt().isEqual(today)) {
                // 퇴사일이 오늘이거나 과거일 때만 퇴사 상태로 변경
                if (!"02".equals(user.getUserStatus())) {
                    user.setUserStatus("02");
                    System.out.println("퇴사일 입력 (오늘/과거) - 재직상태를 퇴사로 자동 변경");
                }
            } else {
                // 퇴사일이 미래일 때는 상태를 변경하지 않음 (퇴사 예정 상태)
                System.out.println("퇴사일이 미래 날짜입니다 (" + user.getRetireDt() + "). 퇴사일이 되면 자동으로 퇴사 처리됩니다.");
            }
        }
        
        // 3. 퇴사일이 삭제되었을 때 재직상태가 퇴사라면 재직중으로 변경
        if (user.getRetireDt() == null && "02".equals(user.getUserStatus())) {
            user.setUserStatus("01");
            System.out.println("퇴사일 삭제 - 재직상태를 재직중으로 자동 변경");
        }
    }

    /**
     * 새로운 사용자 추가
     * 
     * @param userMst 추가할 사용자 정보
     * @return 저장된 사용자 정보 (ID 포함)
     */
    @Transactional
    public Usermst addUser(Usermst userMst) {
        // ID, 이메일 등 Unique 필드 중복 검사
        if (userMstRepository.findByUserId(userMst.getUserId()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사용자 ID입니다: " + userMst.getUserId());
        }
        if (userMstRepository.findByUserEmail(userMst.getUserEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + userMst.getUserEmail());
        }

        // PasswordHandler 주입
        userMst.setPasswordHandler(passwordHandler);
        
        // 비밀번호 암호화 처리
        if (userMst.getUserPswd() != null && !userMst.getUserPswd().isEmpty()) {
            // 현재 비밀번호가 이미 암호화되어 있는지 확인
            if (!userMst.isPasswordEncoded()) {
                userMst.setRawPassword(userMst.getUserPswd()); // 평문 비밀번호를 암호화해서 저장
            }
        } else {
            throw new IllegalArgumentException("비밀번호는 필수입니다");
        }

        // USER_ROLE, USER_STATUS 기본값 설정 (엔티티의 @PrePersist에서도 처리됨)
        if (userMst.getUserRole() == null || userMst.getUserRole().isEmpty()) {
            userMst.setUserRole("01"); // 기본값
        }
        if (userMst.getUserStatus() == null || userMst.getUserStatus().isEmpty()) {
            userMst.setUserStatus("01"); // 기본값
        }

        // 퇴사일/재직상태 자동 처리 로직 적용
        handleRetirementLogic(userMst);

        return userMstRepository.save(userMst);
    }

    /**
     * 사용자 정보 수정
     * 
     * @param userIdx 수정할 사용자의 고유 번호
     * @param userDetails 수정할 사용자 정보
     * @return 수정된 사용자 정보
     */
    @Transactional
    public Usermst updateUser(Long userIdx, Usermst userDetails) {
        Usermst existingUser = userMstRepository.findById(userIdx)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. ID: " + userIdx));

        // PasswordHandler 주입
        existingUser.setPasswordHandler(passwordHandler);

        // 비밀번호 변경 로직 - 값이 있을 때만 변경
        if (userDetails.getUserPswd() != null && !userDetails.getUserPswd().isEmpty()) {
            // 새로운 비밀번호가 이미 암호화되어 있는지 확인
            if (passwordHandler.isEncoded(userDetails.getUserPswd())) {
                // 이미 암호화된 비밀번호라면 그대로 설정
                existingUser.setUserPswd(userDetails.getUserPswd());
            } else {
                // 평문 비밀번호라면 암호화해서 설정
                existingUser.setRawPassword(userDetails.getUserPswd());
            }
        }

        existingUser.setUserNm(userDetails.getUserNm());

        // 이메일 변경 시 중복 검사
        if (!existingUser.getUserEmail().equals(userDetails.getUserEmail())) {
            if (userMstRepository.findByUserEmail(userDetails.getUserEmail()).isPresent()) {
                throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + userDetails.getUserEmail());
            }
            existingUser.setUserEmail(userDetails.getUserEmail());
        }

        existingUser.setUserTel(userDetails.getUserTel());
        existingUser.setUserHp(userDetails.getUserHp());
        existingUser.setUserDept(userDetails.getUserDept());
        existingUser.setUserPosition(userDetails.getUserPosition());
        
        // 퇴사일과 재직상태 설정
        existingUser.setRetireDt(userDetails.getRetireDt());
        existingUser.setUserRole(userDetails.getUserRole());
        existingUser.setUserStatus(userDetails.getUserStatus());

        // 퇴사일/재직상태 자동 처리 로직 적용
        handleRetirementLogic(existingUser);

        return userMstRepository.save(existingUser);
    }

    /**
     * 비밀번호 변경 (사용자가 직접 변경)
     * 
     * @param userId      사용자 ID
     * @param oldPassword 기존 비밀번호
     * @param newPassword 새 비밀번호
     */
    @Transactional
    public void changeUserPassword(String userId, String oldPassword, String newPassword) {
        Optional<Usermst> userOpt = userMstRepository.findByUserId(userId);
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId);
        }
        
        Usermst user = userOpt.get();
        
        // PasswordHandler 주입 후 비밀번호 변경
        user.setPasswordHandler(passwordHandler);
        user.changePassword(oldPassword, newPassword);
        
        userMstRepository.save(user);
    }

    /**
     * 관리자용 비밀번호 리셋
     * 
     * @param userId 사용자 ID
     * @return 임시 비밀번호 (평문)
     */
    @Transactional
    public String resetUserPassword(String userId) {
        Optional<Usermst> userOpt = userMstRepository.findByUserId(userId);
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId);
        }
        
        Usermst user = userOpt.get();
        
        // 임시 비밀번호 생성
        String tempPassword = passwordHandler.generateTemporaryPassword(8);
        
        // PasswordHandler 주입 후 비밀번호 리셋
        user.setPasswordHandler(passwordHandler);
        user.resetPassword(tempPassword);
        
        userMstRepository.save(user);
        
        return tempPassword; // 임시 비밀번호 반환 (메일/SMS 발송 등에 사용)
    }

    /**
     * 여러 사용자 ID를 받아 해당 사용자들을 삭제합니다. 이 작업은 하나의 트랜잭션으로 묶여 원자성을 보장합니다.
     *
     * @param userIdxs 삭제할 사용자 ID 목록
     * @throws IllegalArgumentException userIdxs 목록이 null이거나 비어있을 경우
     */
    @Transactional // 여러 삭제 작업이 하나의 트랜잭션으로 묶이도록 보장
    public void deleteUsers(List<Long> userIdxs) {
        if (userIdxs == null || userIdxs.isEmpty()) {
            throw new IllegalArgumentException("삭제할 사용자 ID 목록이 비어 있습니다.");
        }

        // Spring Data JPA의 deleteAllById 메서드를 사용하여 효율적으로 여러 항목 삭제
        userMstRepository.deleteAllById(userIdxs);
    }

    // 창고 담당자 셀렉트에 사용
    // USER_STATUS가 '01'인 사용자들의 USER_IDX, USER_ID, USER_NM만 가져오는 메소드
    public List<UserSelectDto> getActiveUsersForSelection() {
        return userMstRepository.findByUserStatus("01").stream() // '01' 상태인 사용자만 필터링
                .map(user -> new UserSelectDto(user.getUserIdx(), user.getUserId(), user.getUserNm())) // DTO로 변환
                .collect(Collectors.toList());
    }

    /**
     * 비밀번호 암호화만 수행 (유틸리티 메서드)
     */
    public String encodePassword(String rawPassword) {
        return passwordHandler.encode(rawPassword);
    }

    /**
     * 비밀번호 검증만 수행 (유틸리티 메서드)
     */
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordHandler.matches(rawPassword, encodedPassword);
    }

    // ===== 퇴사 관련 추가 메서드들 =====

    /**
     * 퇴사 처리 대상 사용자 조회 (스케줄러에서 사용)
     * 
     * @return 퇴사 처리 대상 사용자 목록
     */
    @Transactional(readOnly = true)
    public List<Usermst> getUsersToRetire() {
        return userMstRepository.findUsersToRetire(LocalDate.now());
    }

    /**
     * 특정 날짜에 퇴사 예정인 사용자 조회
     * 
     * @param targetDate 조회할 날짜
     * @return 해당 날짜 퇴사 예정 사용자 목록
     */
    @Transactional(readOnly = true)
    public List<Usermst> getUsersRetireOnDate(LocalDate targetDate) {
        return userMstRepository.findUsersRetireOnDate(targetDate);
    }

    /**
     * 퇴사 예정 사용자 전체 조회
     * 
     * @return 퇴사 예정 사용자 목록 (날짜순 정렬)
     */
    @Transactional(readOnly = true)
    public List<Usermst> getPendingRetirements() {
        return userMstRepository.findPendingRetirements();
    }

    /**
     * 특정 기간 내 퇴사 예정 사용자 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 해당 기간 내 퇴사 예정 사용자 목록
     */
    @Transactional(readOnly = true)
    public List<Usermst> getUsersRetireBetweenDates(LocalDate startDate, LocalDate endDate) {
        return userMstRepository.findUsersRetireBetweenDates(startDate, endDate);
    }

    /**
     * 퇴사 처리 실행 (스케줄러에서 호출)
     * 
     * @return 처리된 사용자 수
     */
    @Transactional
    public int processRetirements() {
        List<Usermst> usersToRetire = getUsersToRetire();
        
        for (Usermst user : usersToRetire) {
            user.setUserStatus("02"); // 퇴사로 변경
            userMstRepository.save(user);
        }
        
        return usersToRetire.size();
    }
    
    /**
     * 선택된 사원들의 정보를 Excel 파일로 생성
     * 
     * @param userIdxs 사원 ID 목록
     * @return Excel 파일 바이트 배열
     */
    public byte[] generateEmployeeExcel(List<Long> userIdxs) {
        XSSFWorkbook workbook = null;
        try {
            // Apache POI 5.3.0을 사용한 Excel 생성
            workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("사원 정보");
            
            // 헤더 스타일 생성
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            
            // 헤더 생성
            Row headerRow = sheet.createRow(0);
            String[] headers = {"이름", "ID", "이메일", "직통번호", "휴대폰", "부서", "직책", "권한", "재직상태", "입사일", "퇴사일"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // 데이터 스타일 생성
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            
            // 날짜 스타일 생성
            CellStyle dateStyle = workbook.createCellStyle();
            CreationHelper createHelper = workbook.getCreationHelper();
            dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd"));
            dateStyle.setBorderBottom(BorderStyle.THIN);
            dateStyle.setBorderTop(BorderStyle.THIN);
            dateStyle.setBorderRight(BorderStyle.THIN);
            dateStyle.setBorderLeft(BorderStyle.THIN);
            
            // 데이터 조회 및 입력
            List<Usermst> users = userMstRepository.findAllById(userIdxs);
            
            int rowNum = 1;
            for (Usermst user : users) {
                Row row = sheet.createRow(rowNum++);
                
                Cell cell0 = row.createCell(0);
                cell0.setCellValue(user.getUserNm() != null ? user.getUserNm() : "");
                cell0.setCellStyle(dataStyle);
                
                Cell cell1 = row.createCell(1);
                cell1.setCellValue(user.getUserId() != null ? user.getUserId() : "");
                cell1.setCellStyle(dataStyle);
                
                Cell cell2 = row.createCell(2);
                cell2.setCellValue(user.getUserEmail() != null ? user.getUserEmail() : "");
                cell2.setCellStyle(dataStyle);
                
                Cell cell3 = row.createCell(3);
                cell3.setCellValue(user.getUserTel() != null ? user.getUserTel() : "");
                cell3.setCellStyle(dataStyle);
                
                Cell cell4 = row.createCell(4);
                cell4.setCellValue(user.getUserHp() != null ? user.getUserHp() : "");
                cell4.setCellStyle(dataStyle);
                
                Cell cell5 = row.createCell(5);
                cell5.setCellValue(user.getUserDept() != null ? user.getUserDept() : "");
                cell5.setCellStyle(dataStyle);
                
                Cell cell6 = row.createCell(6);
                cell6.setCellValue(user.getUserPosition() != null ? user.getUserPosition() : "");
                cell6.setCellStyle(dataStyle);
                
                Cell cell7 = row.createCell(7);
                cell7.setCellValue(getRoleName(user.getUserRole()));
                cell7.setCellStyle(dataStyle);
                
                Cell cell8 = row.createCell(8);
                cell8.setCellValue(getStatusName(user.getUserStatus()));
                cell8.setCellStyle(dataStyle);
                
                Cell cell9 = row.createCell(9);
                if (user.getHireDt() != null) {
                    cell9.setCellValue(java.sql.Date.valueOf(user.getHireDt()));
                    cell9.setCellStyle(dateStyle);
                } else {
                    cell9.setCellValue("");
                    cell9.setCellStyle(dataStyle);
                }
                
                Cell cell10 = row.createCell(10);
                if (user.getRetireDt() != null) {
                    cell10.setCellValue(java.sql.Date.valueOf(user.getRetireDt()));
                    cell10.setCellStyle(dateStyle);
                } else {
                    cell10.setCellValue("");
                    cell10.setCellStyle(dataStyle);
                }
            }
            
            // 컬럼 너비 자동 조정
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            // 바이트 배열로 변환
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            
            return outputStream.toByteArray();
            
        } catch (Exception e) {
            throw new RuntimeException("Excel 파일 생성 중 오류 발생", e);
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (Exception e) {
                    // 로그만 남기고 무시
                    System.err.println("Excel workbook 닫기 중 오류: " + e.getMessage());
                }
            }
        }
    }
    
    /**
     * 권한 코드를 한글명으로 변환
     */
    private String getRoleName(String roleCode) {
        if (roleCode == null) return "";
        
        switch (roleCode) {
            case "01": return "시스템관리자";
            case "02": return "대표";
            case "03": return "영업 담당자";
            case "04": return "구매 담당자";
            case "05": return "생산 관리자";
            case "06": return "재고 관리자";
            case "07": return "인사 담당자";
            default: return roleCode;
        }
    }
    
    /**
     * 재직상태 코드를 한글명으로 변환
     */
    private String getStatusName(String statusCode) {
        if (statusCode == null) return "";
        
        switch (statusCode) {
            case "01": return "재직중";
            case "02": return "퇴사";
            case "03": return "휴직";
            case "04": return "대기";
            case "05": return "정직";
            default: return statusCode;
        }
    }
}