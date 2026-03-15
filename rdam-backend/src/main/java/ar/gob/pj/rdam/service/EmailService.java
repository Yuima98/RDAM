package ar.gob.pj.rdam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${rdam.mail.from}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarOtp(String destinatario, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(destinatario);
            message.setSubject("Tu código de acceso - RDAM Poder Judicial Santa Fe");
            message.setText(
                "Hola,\n\n" +
                "Tu código de verificación para acceder al sistema RDAM es:\n\n" +
                "    " + otpCode + "\n\n" +
                "Este código es válido por 10 minutos.\n\n" +
                "Si no solicitaste este código, ignorá este mensaje.\n\n" +
                "Poder Judicial de la Provincia de Santa Fe"
            );
            mailSender.send(message);
            log.info("OTP enviado por email a: {}", destinatario);
        } catch (MailException e) {
            log.error("Error al enviar OTP por email a {}: {}", destinatario, e.getMessage());
            throw new RuntimeException("No se pudo enviar el email de verificación", e);
        }
    }
}