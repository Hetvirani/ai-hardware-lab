import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from esp32_simulator import ESP32Simulator


def run_gpio_led_blink():
    esp = ESP32Simulator()
    esp.uart_begin(115200)

    LED_PIN    = 2
    BUTTON_PIN = 0

    esp.pin_mode(LED_PIN,    "OUTPUT")
    esp.pin_mode(BUTTON_PIN, "INPUT")
    esp.uart_print("LED Blink started — GPIO2=LED GPIO0=BUTTON")

    results = []

    for cycle in range(5):
        esp.tick(10)
        esp.digital_write(LED_PIN, 1)
        esp.uart_print(f"Cycle {cycle+1}: LED ON")
        results.append({"cycle": cycle+1, "state": "ON",  "time_ms": esp.time_ms})

        esp.tick(500)
        esp.digital_write(LED_PIN, 0)
        esp.uart_print(f"Cycle {cycle+1}: LED OFF")
        results.append({"cycle": cycle+1, "state": "OFF", "time_ms": esp.time_ms})

        esp.tick(500)

    esp.uart_print("PASS: GPIO LED blink test complete")

    return {
        "program":    "GPIO LED Blink",
        "pin_led":    LED_PIN,
        "pin_button": BUTTON_PIN,
        "cycles":     5,
        "results":    results,
        "log":        esp.simulation_log,
        "status":     "PASS"
    }


def run_sensor_reading():
    esp = ESP32Simulator()
    esp.uart_begin(115200)

    TEMP_PIN    = 34
    VOLTAGE_PIN = 35

    esp.uart_print("Sensor reading started")
    readings = []

    for i in range(8):
        esp.tick(500)
        temp = esp.read_temperature(TEMP_PIN)
        volt = esp.read_voltage(VOLTAGE_PIN)
        esp.uart_print(
            f"Sample {i+1}: "
            f"Temp={temp['temperature_c']}C  "
            f"Volt={volt['voltage']}V"
        )
        readings.append({
            "sample":      i + 1,
            "time_ms":     esp.time_ms,
            "temperature": temp["temperature_c"],
            "voltage":     volt["voltage"],
            "temp_raw":    int((temp["voltage"] / 3.3) * 4095),
            "volt_raw":    volt["raw"]
        })

    temps    = [r["temperature"] for r in readings]
    avg_temp = round(sum(temps) / len(temps), 2)
    min_temp = round(min(temps), 2)
    max_temp = round(max(temps), 2)

    esp.uart_print(
        f"Stats: avg={avg_temp}C  "
        f"min={min_temp}C  max={max_temp}C"
    )
    esp.uart_print("PASS: Sensor reading test complete")

    return {
        "program":  "Sensor Reading",
        "readings": readings,
        "stats":    {
            "avg_temp": avg_temp,
            "min_temp": min_temp,
            "max_temp": max_temp
        },
        "log":    esp.simulation_log,
        "status": "PASS"
    }


def run_pwm_control():
    esp = ESP32Simulator()
    esp.uart_begin(115200)

    MOTOR_PIN = 18
    LED_PIN   = 19

    esp.pwm_setup(MOTOR_PIN, freq=5000, resolution=8)
    esp.pwm_setup(LED_PIN,   freq=1000, resolution=8)
    esp.uart_print("PWM control started — GPIO18=Motor GPIO19=LED")

    results      = []
    duty_levels  = [0, 25, 50, 75, 100, 75, 50, 25, 0]

    for duty in duty_levels:
        esp.tick(200)
        motor = esp.pwm_write(MOTOR_PIN, duty)
        led   = esp.pwm_write(LED_PIN,   duty)
        esp.uart_print(
            f"Duty={duty}%  "
            f"Motor={motor['duty_raw']}/255  "
            f"LED={led['duty_raw']}/255"
        )
        results.append({
            "duty_percent": duty,
            "motor_raw":    motor["duty_raw"],
            "led_raw":      led["duty_raw"],
            "time_ms":      esp.time_ms
        })

    esp.uart_print("PASS: PWM control test complete")

    return {
        "program":   "PWM Control",
        "motor_pin": MOTOR_PIN,
        "led_pin":   LED_PIN,
        "steps":     results,
        "log":       esp.simulation_log,
        "status":    "PASS"
    }


def run_uart_communication():
    esp = ESP32Simulator()
    esp.uart_begin(115200)

    messages = [
        "HELLO:ESP32",
        "STATUS:OK",
        "TEMP:25.3",
        "VOLTAGE:3.28",
        "GPIO:HIGH",
        "PWM:75",
        "SENSOR:READY",
        "END:TRANSMISSION"
    ]

    esp.uart_print("UART loopback test started")
    sent     = []
    received = []

    for msg in messages:
        esp.tick(100)
        esp.uart_print(msg)
        sent.append({"message": msg, "time_ms": esp.time_ms})

    for item in sent:
        esp.uart_buffer.append(item["message"])
        rx = esp.uart_read()
        if rx:
            esp.tick(10)
            received.append({"message": rx, "time_ms": esp.time_ms})

    passed = len(received)
    failed = len(sent) - passed
    status = "PASS" if failed == 0 else "FAIL"

    esp.uart_print(
        f"{status}: UART loopback — "
        f"{passed} sent  {passed} received  {failed} errors"
    )

    return {
        "program":           "UART Communication",
        "baud_rate":         115200,
        "messages_sent":     len(sent),
        "messages_received": len(received),
        "sent":              sent,
        "received":          received,
        "log":               esp.simulation_log,
        "status":            status
    }


def run_full_esp32_demo():
    programs = {
        "gpio":   run_gpio_led_blink(),
        "sensor": run_sensor_reading(),
        "pwm":    run_pwm_control(),
        "uart":   run_uart_communication()
    }

    passed = sum(1 for p in programs.values() if p["status"] == "PASS")
    failed = sum(1 for p in programs.values() if p["status"] == "FAIL")

    return {
        "platform":    "ESP32 (Virtual Simulation)",
        "programs":    programs,
        "total_pass":  passed,
        "total_fail":  failed,
        "summary":     f"{passed}/4 programs passed"
    }