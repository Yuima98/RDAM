package ar.gob.pj.rdam.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "rdam.mail")
public class MailProperties {

    private String from;

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
}