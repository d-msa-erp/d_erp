package kr.co.d_erp.controllers;

import kr.co.d_erp.dtos.Usermst;
import kr.co.d_erp.service.UsermstService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users") // API 경로 설정
@RequiredArgsConstructor
public class UsermstController {

    private final UsermstService UsermstService;

    // 전체 사용자 조회
    @GetMapping
    public ResponseEntity<List<Usermst>> getAllUsers() {
        List<Usermst> users = UsermstService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // 특정 사용자 조회
    @GetMapping("/{idx}")
    public ResponseEntity<Usermst> getUserById(@PathVariable("idx") Long userIdx) {
        return UsermstService.getUserByIdx(userIdx)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 사용자 추가
    @PostMapping
    public ResponseEntity<Usermst> createUser(@RequestBody Usermst Usermst) {
        try {
            Usermst newUser = UsermstService.addUser(Usermst);
            return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null); // 간단한 예외 처리
        }
    }

    // 사용자 수정
    @PutMapping("/{idx}")
    public ResponseEntity<Usermst> updateUser(@PathVariable("idx") Long userIdx, @RequestBody Usermst userDetails) {
        try {
            Usermst updatedUser = UsermstService.updateUser(userIdx, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) { // RuntimeException은 구체적인 예외로 변경 권장
            if (e.getMessage().contains("찾을 수 없습니다")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(null); // 간단한 예외 처리
        }
    }

    // 사용자 삭제 (필요시)
    @DeleteMapping("/{idx}")
    public ResponseEntity<Void> deleteUser(@PathVariable("idx") Long userIdx) {
        try {
            UsermstService.deleteUser(userIdx);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("찾을 수 없습니다")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}