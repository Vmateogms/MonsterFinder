package monstermapa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MonstermapaApplication {

	public static void main(String[] args) {
		SpringApplication.run(MonstermapaApplication.class, args);
	}

}
