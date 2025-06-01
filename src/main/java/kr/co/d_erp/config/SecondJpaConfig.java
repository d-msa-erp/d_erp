package kr.co.d_erp.config;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;  //import jakarta.sql.DataSource; 

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement // 트랜잭션 관리를 활성화합니다.
// 이 JPA 설정을 사용할 Repository 인터페이스들이 있는 기본 패키지를 지정합니다.
@EnableJpaRepositories(
    basePackages = "kr.co.d_erp.repository.mysql", // NoticeRepository가 있는 패키지 경로 (이 경로는 그대로 둡니다)
    entityManagerFactoryRef = "secondEntityManagerFactory", // EntityManagerFactory 빈 이름 지정
    transactionManagerRef = "secondTransactionManager" // TransactionManager 빈 이름 지정
)
public class SecondJpaConfig {

    // "Mysql" 이라는 이름의 DataSource 빈을 주입받습니다. (SecondDatabase 클래스에서 정의된 빈)
    @Bean(name = "secondEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean secondEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("Mysql") DataSource secondDataSource) { // SecondDatabase에서 만든 DataSource 빈 이름 ("Mysql") 사용
        return builder
                .dataSource(secondDataSource) // 사용할 데이터 소스를 지정합니다.
                // **** 수정된 부분: 엔티티 클래스(Notice 등)가 있는 실제 패키지를 지정합니다. ****
                .packages("kr.co.d_erp.dtos") // Notice.java 파일이 이 패키지에 있다고 가정하고 수정
                // 만약 다른 엔티티 클래스가 다른 패키지에 있다면 여기에 추가합니다. 예: .packages("kr.co.d_erp.dtos", "다른.엔티티.패키지")
                .persistenceUnit("secondPU") // Persistence Unit 이름 지정 (옵션이지만 다중 DataSource 시 구분 용이)
                .properties(jpaProperties()) // 추가 JPA 속성 설정 (예: hibernate 설정)
                .build();
    }

    // JPA 공급자(Hibernate 등)에 대한 추가 속성을 설정합니다.
    private Map<String, ?> jpaProperties() {
        Map<String, Object> props = new HashMap<>();
        // 하이버네이트 설정을 여기에 추가할 수 있습니다. 필요하다면 주석을 풀고 설정하세요.
        // 예: props.put("hibernate.hbm2ddl.auto", "update"); // 개발 시 DDL 자동 생성/업데이트 (주의: 운영에선 'none' 권장)
        // 예: props.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect"); // MySQL 방언 설정 (사용하는 MySQL 버전에 맞는 Dialect 클래스 확인)
        // 예: props.put("hibernate.show_sql", "true"); // 콘솔에 SQL 로그 출력
        // 예: props.put("hibernate.format_sql", "true"); // SQL 로그 포맷팅
        return props;
    }

    // 트랜잭션 관리자 빈을 설정합니다.
    @Bean(name = "secondTransactionManager")
    public PlatformTransactionManager secondTransactionManager(
            @Qualifier("secondEntityManagerFactory") EntityManagerFactory secondEntityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(secondEntityManagerFactory); // 위에서 정의한 EntityManagerFactory 연결
        return transactionManager;
    }
}