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
spring.datasource.url=jdbc:h2:mem:chessbrawl
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update


### Rode o projeto 
mvn spring-boot:run

### Acesse a aplicação no SEU navegador
http://localhost:8080