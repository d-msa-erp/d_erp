package kr.co.d_erp.config;

import java.util.Properties;

import javax.sql.DataSource;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


//Mysql
@Configuration
public class SecondDatabase {

	// Properties파일을 로드
	Properties pp = new Properties();
	String pname = "database.properties"; // Properties파일명

	public SecondDatabase() throws Exception {
				this.pp.load(this.getClass().getClassLoader().getResourceAsStream(pname));
				this.pp.setProperty("spring.datasource.driver-class-name",this.pp.getProperty("spring.second.datasource.driver-class-name"));
				this.pp.setProperty("spring.datasource.url", this.pp.getProperty("spring.second.datasource.url"));
				this.pp.setProperty("spring.datasource.username", this.pp.getProperty("spring.second.datasource.username"));
				this.pp.setProperty("spring.datasource.password", this.pp.getProperty("spring.second.datasource.password"));
			}

	@Bean(name = "Mysql") // 주석하면 안돌아감
	public DataSource datasource() {
		// DataSource룰 변경시 Mybatis에서 Database 서버 정보응 변경함
		String classnm = this.pp.getProperty("spring.datasource.driver-class-name");
		String url = this.pp.getProperty("spring.datasource.url");
		String user = this.pp.getProperty("spring.datasource.username");
		String pass = this.pp.getProperty("spring.datasource.password");

		// DataSource 정보를 저장하는 배열값
		DataSourceBuilder dsb = DataSourceBuilder.create();
		dsb.driverClassName(classnm);
		dsb.url(url);
		dsb.username(user);
		dsb.password(pass);
		return dsb.build();
	}

	@Bean(name = "sqlfactory2")
	public SqlSessionFactory sqlfactory(@Qualifier("Mysql") DataSource ds, ApplicationContext ac) throws Exception {
		SqlSessionFactoryBean sqlf = new SqlSessionFactoryBean();
		sqlf.setDataSource(ds);
		sqlf.setMapperLocations(ac.getResources("classpath:/mapper/*.xml"));

		return sqlf.getObject();
	}

	@Bean(name = "sqltemplate2")
	public SqlSessionTemplate sqltemplate(@Qualifier("sqlfactory2") SqlSessionFactory sf) throws Exception {
		SqlSessionTemplate stp = new SqlSessionTemplate(sf);
		return stp;
	}

}
