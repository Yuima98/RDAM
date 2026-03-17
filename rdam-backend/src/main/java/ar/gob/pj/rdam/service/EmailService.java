package ar.gob.pj.rdam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.file.Path;

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

    /**
     * Envía el certificado PDF como adjunto al email de contacto del solicitante.
     * Usado al publicar el certificado y al reenviar desde el portal ciudadano.
     *
     * @param destinatario  email del solicitante
     * @param nroTramite    número de trámite (RDAM-YYYYMMDD-NNNN)
     * @param pdfPath       ruta al archivo PDF en el servidor
     */
    public void enviarCertificado(String destinatario, String nroTramite, Path pdfPath) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(destinatario);
            helper.setSubject("Tu certificado de libre deuda - " + nroTramite);
            helper.setText(
                "Hola,\n\n" +
                "Tu certificado de libre deuda alimentaria está disponible.\n\n" +
                "Número de trámite: " + nroTramite + "\n\n" +
                "Encontrarás el certificado adjunto a este email. " +
                "También podés descargarlo desde el portal RDAM.\n\n" +
                "Poder Judicial de la Provincia de Santa Fe"
            );
            helper.addAttachment("certificado_" + nroTramite + ".pdf", new PathResource(pdfPath));
            mailSender.send(message);
            log.info("Certificado {} enviado por email a: {}", nroTramite, destinatario);
        } catch (MailException | MessagingException e) {
            log.error("Error al enviar certificado por email a {}: {}", destinatario, e.getMessage());
            throw new RuntimeException("No se pudo enviar el certificado por email", e);
        }
    }
}