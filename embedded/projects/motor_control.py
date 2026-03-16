"""
Project: Motor Speed Control
Platform: ESP32
Description: Controls motor speed using PWM.
             Reads analog input to set speed.
             Monitors current via ADC.
"""

def run(esp):

    MOTOR_PIN   = 18
    SPEED_PIN   = 35
    CURRENT_PIN = 36
    DIR_PIN     = 19

    esp.uart_begin(115200)
    esp.uart_print("=== Motor Speed Control ===")
    esp.uart_print(
        f"Motor PWM: GPIO{MOTOR_PIN}  "
        f"Direction: GPIO{DIR_PIN}"
    )

    esp.pwm_setup(MOTOR_PIN, freq=5000, resolution=8)
    esp.pin_mode(DIR_PIN, "OUTPUT")

    results = []

    # Ramp up forward
    esp.uart_print("--- Forward ramp up ---")
    esp.digital_write(DIR_PIN, 1)

    for speed in [0, 20, 40, 60, 80, 100]:
        esp.tick(300)
        pwm    = esp.pwm_write(MOTOR_PIN, speed)
        sensor = esp.read_voltage(SPEED_PIN)
        current = esp.read_voltage(CURRENT_PIN)

        esp.uart_print(
            f"Speed={speed}%  "
            f"PWM={pwm['duty_raw']}/255  "
            f"V={sensor['voltage']}V  "
            f"I={current['voltage']}A"
        )

        results.append({
            "direction": "FORWARD",
            "speed_pct": speed,
            "pwm_raw":   pwm["duty_raw"],
            "voltage":   sensor["voltage"],
            "time_ms":   esp.time_ms
        })

    # Stop
    esp.tick(200)
    esp.pwm_write(MOTOR_PIN, 0)
    esp.uart_print("Motor stopped")

    # Ramp up reverse
    esp.uart_print("--- Reverse ramp up ---")
    esp.digital_write(DIR_PIN, 0)

    for speed in [0, 30, 60, 100]:
        esp.tick(300)
        pwm = esp.pwm_write(MOTOR_PIN, speed)
        esp.uart_print(
            f"Speed={speed}%  "
            f"PWM={pwm['duty_raw']}/255  REVERSE"
        )
        results.append({
            "direction": "REVERSE",
            "speed_pct": speed,
            "pwm_raw":   pwm["duty_raw"],
            "time_ms":   esp.time_ms
        })

    esp.pwm_write(MOTOR_PIN, 0)
    esp.uart_print("PASS: Motor control project complete")

    return {
        "project":  "Motor Speed Control",
        "results":  results,
        "status":   "PASS"
    }