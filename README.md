# ChessBrawl

### Backend
- **Java** com **Spring Boot**:
  - Spring Data JPA para persistência.
  - Spring MVC para criação de APIs REST.
  - Spring Transaction para controle transacional.
- Banco de dados **MySQL** (configurável).

### Frontend
- **HTML**, **CSS**, **JavaScript**:

### Dependências
- **Lombok**
- **Hibernate**
- **Font Awesome**

### Configurar o application properties
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/chessbrawl?useSSL=false&serverTimezone=UTC
spring.datasource.username=
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
server.port=8080
server.servlet.context-path=/
spring.devtools.restart.enabled=true
spring.devtools.livereload.enabled=true
spring.web.resources.static-locations=classpath:/static/
spring.web.resources.cache.period=0
spring.web.resources.chain.cache=false




### Rode o projeto 
mvn spring-boot:run

### Acesse a aplicação no SEU navegador
http://localhost:8080/index.html
