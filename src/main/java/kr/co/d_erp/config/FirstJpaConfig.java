package kr.co.d_erp.config;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource; // import jakarta.sql.DataSource; 에 맞게 사용하세요

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary; // @Primary 어노테이션 import
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
// @Primary: 이 설정이 기본(default) JPA 설정임을 나타냅니다.
@Primary
@EnableJpaRepositories(
    basePackages = "kr.co.d_erp.repository.oracle", // <-- User Repository (UsermstRepository 등)가 있는 패키지 지정
    // 만약 특정 Repository만 Oracle을 사용한다면 더 구체적인 패키지를 지정할 수 있습니다.
    // 예: "kr.co.d_erp.repository.user"
    entityManagerFactoryRef = "firstEntityManagerFactory", // 기본 EntityManagerFactory 빈 이름 지정
    transactionManagerRef = "firstTransactionManager" // 기본 TransactionManager 빈 이름 지정
    // secondary 설정에서 스캔하는 패키지와 겹치지 않도록 주의하거나 excludeFilters를 사용할 수 있습니다.
)
public class FirstJpaConfig { // 클래스 이름이 FirstJpaConfig로 변경되었습니다.

    // Primary DataSource 빈을 주입받습니다. (@Qualifier로 특정 이름 지정 또는 @Primary DataSource 주입)
    // DataSource 빈 이름은 Oracle DataSource를 정의한 Configuration 클래스에 맞게 수정하세요.
    // 예시: @Qualifier("oracleDataSource") DataSource primaryDataSource
    // @Primary 어노테이션이 붙은 DataSource를 사용한다면 @Qualifier 없이 DataSource primaryDataSource 로 받을 수 있습니다.
    @Primary
    @Bean(name = "firstEntityManagerFactory") // 빈 이름이 firstEntityManagerFactory로 변경되었습니다.
    public LocalContainerEntityManagerFactoryBean firstEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            DataSource primaryDataSource) { // @Primary DataSource 자동 주입 또는 @Qualifier 사용

        return builder
                .dataSource(primaryDataSource) // 사용할 Oracle 데이터 소스를 지정합니다.
                // **** 엔티티 클래스(Usermst 등)가 있는 실제 패키지를 지정합니다. ****
                // SecondJpaConfig의 packages 설정과 겹치지 않도록 주의하세요.
                .packages("kr.co.d_erp.dtos") // <-- Usermst.java 파일이 이 패키지에 있다고 가정하고 수정
                // 만약 다른 엔티티 클래스가 다른 패키지에 있다면 여기에 추가합니다.
                // 예: .packages("kr.co.d_erp.dtos", "다른.엔티티.패키지")
                .persistenceUnit("firstPU") // Persistence Unit 이름 지정 (옵션이지만 다중 DataSource 시 구분 용이) - 선택적으로 변경
                .properties(jpaProperties()) // 추가 JPA 속성 설정 (예: hibernate 설정)
                .build();
    }

    // JPA 공급자(Hibernate 등)에 대한 추가 속성을 설정합니다.
    private Map<String, ?> jpaProperties() {
        Map<String, Object> props = new HashMap<>();
        // Oracle 관련 하이버네이트 설정을 여기에 추가합니다.
        // 필요하다면 주석을 풀고 설정하세요.

        // Oracle 방언 설정 (사용하는 Oracle 버전에 맞는 Dialect 클래스 확인)
        // 예: props.put("hibernate.dialect", "org.hibernate.dialect.OracleDialect");
        // 예: props.put("hibernate.dialect", "org.hibernate.dialect.Oracle12cDialect");

        // 개발 시 DDL 자동 생성/업데이트 (주의: 운영에선 'none' 권장)
        // props.put("hibernate.hbm2ddl.auto", "none"); // 현재 에러로 볼 때 테이블이 없는 상태이므로 create나 update 고려 (단, 데이터 날아갈 수 있음)
                                                      // 일반적으로는 직접 DDL 스크립트로 테이블을 생성하는 것을 권장합니다.

        // 콘솔에 SQL 로그 출력
        // props.put("hibernate.show_sql", "true");
        // SQL 로그 포맷팅
        // props.put("hibernate.format_sql", "true");

        // 추가 설정...
        return props;
    }

    // Primary 트랜잭션 관리자 빈을 설정합니다.
    @Primary
    @Bean(name = "firstTransactionManager") // 빈 이름이 firstTransactionManager로 변경되었습니다.
    public PlatformTransactionManager firstTransactionManager(
            @Qualifier("firstEntityManagerFactory") EntityManagerFactory firstEntityManagerFactory) { // 위에서 정의한 기본 EntityManagerFactory 연결
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(firstEntityManagerFactory);
        return transactionManager;
    }
}