import math
import random


class ESP32Simulator:

    def __init__(self):
        self.gpio_pins      = {}
        self.adc_pins       = {}
        self.pwm_channels   = {}
        self.uart_buffer    = []
        self.simulation_log = []
        self.time_ms        = 0

        for pin in range(40):
            self.gpio_pins[pin] = {"mode": "INPUT", "value": 0}

        for pin in [32, 33, 34, 35, 36, 39]:
            self.adc_pins[pin] = 0.0

        self.log("ESP32 virtual hardware initialized")
        self.log("CPU: Xtensa LX6 @ 240MHz (simulated)")
        self.log("Flash: 4MB  RAM: 520KB (simulated)")

    def log(self, msg):
        self.simulation_log.append(f"[{self.time_ms}ms] {msg}")

    def tick(self, ms=10):
        self.time_ms += ms

    def reset_log(self):
        self.simulation_log = []
        self.time_ms        = 0

    # ── GPIO ──────────────────────────────────────────────
    def pin_mode(self, pin, mode):
        self.gpio_pins[pin] = {"mode": mode, "value": 0}
        self.log(f"pinMode(GPIO{pin}, {mode})")

    def digital_write(self, pin, value):
        if self.gpio_pins[pin]["mode"] != "OUTPUT":
            self.pin_mode(pin, "OUTPUT")
        self.gpio_pins[pin]["value"] = value
        self.log(f"digitalWrite(GPIO{pin}, {'HIGH' if value else 'LOW'})")

    def digital_read(self, pin):
        val = self.gpio_pins[pin]["value"]
        self.log(f"digitalRead(GPIO{pin}) → {'HIGH' if val else 'LOW'}")
        return val

    # ── ADC / Sensors ──────────────────────────────────────
    def read_temperature(self, pin=34):
        base  = 25.0 + math.sin(self.time_ms / 1000) * 3
        temp  = round(base + random.uniform(-0.2, 0.2), 2)
        volts = round(3.3 * (temp / 100), 3)
        self.adc_pins[pin] = volts
        self.log(f"Temperature(GPIO{pin}) → {temp}°C  {volts}V")
        return {"temperature_c": temp, "voltage": volts, "pin": pin}

    def read_voltage(self, pin=35):
        volts = round(3.3 + random.uniform(-0.02, 0.02), 3)
        raw   = int((volts / 3.3) * 4095)
        self.adc_pins[pin] = volts
        self.log(f"analogRead(GPIO{pin}) → {volts}V  raw={raw}")
        return {"voltage": volts, "raw": raw, "pin": pin}

    # ── PWM ────────────────────────────────────────────────
    def pwm_setup(self, pin, freq=1000, resolution=8):
        self.pwm_channels[pin] = {
            "freq":       freq,
            "resolution": resolution,
            "duty":       0,
            "max_duty":   (2 ** resolution) - 1
        }
        self.log(f"ledcSetup(GPIO{pin}, {freq}Hz, {resolution}bit)")

    def pwm_write(self, pin, duty_percent):
        if pin not in self.pwm_channels:
            self.pwm_setup(pin)
        ch       = self.pwm_channels[pin]
        duty_raw = int((duty_percent / 100) * ch["max_duty"])
        ch["duty"] = duty_raw
        self.log(
            f"ledcWrite(GPIO{pin}, {duty_percent}%) "
            f"raw={duty_raw}/{ch['max_duty']} "
            f"freq={ch['freq']}Hz"
        )
        return {
            "pin":          pin,
            "duty_percent": duty_percent,
            "duty_raw":     duty_raw,
            "frequency":    ch["freq"]
        }

    # ── UART ───────────────────────────────────────────────
    def uart_begin(self, baud=115200):
        self.uart_buffer = []
        self.log(f"Serial.begin({baud})")

    def uart_print(self, message):
        self.uart_buffer.append(message)
        self.log(f"Serial.println → {message}")

    def uart_read(self):
        if self.uart_buffer:
            msg = self.uart_buffer.pop(0)
            self.log(f"Serial.read ← {msg}")
            return msg
        return None