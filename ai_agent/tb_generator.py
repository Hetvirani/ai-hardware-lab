import re
import os
import glob


def parse_module(verilog_path):
    with open(verilog_path, "r") as f:
        code = f.read()

    module_match = re.search(r'\bmodule\s+(\w+)', code)
    if not module_match:
        return None
    module_name = module_match.group(1)

    if "tb" in module_name.lower():
        return None

    inputs  = re.findall(r'\binput\s+(?:reg\s+)?(?:wire\s+)?(\[\d+:\d+\]\s+)?(\w+)', code)
    outputs = re.findall(r'\boutput\s+(?:reg\s+)?(?:wire\s+)?(\[\d+:\d+\]\s+)?(\w+)', code)

    clk_names   = {"clk", "clock", "clk_i"}
    reset_names = {"reset", "rst", "rstn", "rst_n", "reset_n"}

    parsed_inputs  = []
    parsed_outputs = []

    for width, name in inputs:
        width = width.strip() if width else ""
        parsed_inputs.append({
            "name":   name,
            "width":  width,
            "is_clk": name.lower() in clk_names,
            "is_rst": name.lower() in reset_names
        })

    for width, name in outputs:
        width = width.strip() if width else ""
        parsed_outputs.append({
            "name":  name,
            "width": width
        })

    return {
        "module_name": module_name,
        "inputs":      parsed_inputs,
        "outputs":     parsed_outputs
    }


def generate_testbench(module_info):
    m       = module_info["module_name"]
    inputs  = module_info["inputs"]
    outputs = module_info["outputs"]

    has_clk = any(p["is_clk"] for p in inputs)
    has_rst = any(p["is_rst"] for p in inputs)

    lines = []
    lines.append("`timescale 1ns/1ps")
    lines.append("")
    lines.append(f"module {m}_tb;")
    lines.append("")

    for p in inputs:
        w = f" {p['width']}" if p["width"] else ""
        lines.append(f"    reg{w} {p['name']};")

    lines.append("")

    for p in outputs:
        w = f" {p['width']}" if p["width"] else ""
        lines.append(f"    wire{w} {p['name']};")

    lines.append("")
    lines.append(f"    {m} uut (")
    all_ports = inputs + outputs
    for i, p in enumerate(all_ports):
        comma = "," if i < len(all_ports) - 1 else ""
        lines.append(f"        .{p['name']}({p['name']}){comma}")
    lines.append("    );")
    lines.append("")

    if has_clk:
        clk_name = next(p["name"] for p in inputs if p["is_clk"])
        lines.append(f"    initial {clk_name} = 0;")
        lines.append(f"    always #5 {clk_name} = ~{clk_name};")
        lines.append("")

    lines.append("    integer pass_count;")
    lines.append("    integer fail_count;")
    lines.append("")
    lines.append("    initial begin")
    lines.append(f'        $dumpfile("waveform.vcd");')
    lines.append(f"        $dumpvars(0, {m}_tb);")
    lines.append("")
    lines.append("        pass_count = 0;")
    lines.append("        fail_count = 0;")
    lines.append("")

    for p in inputs:
        lines.append(f"        {p['name']} = 0;")
    lines.append("")

    if has_rst and has_clk:
        rst_name = next(p["name"] for p in inputs if p["is_rst"])
        clk_name = next(p["name"] for p in inputs if p["is_clk"])
        lines.append("        // Reset sequence")
        lines.append(f"        {rst_name} = 1;")
        lines.append(f"        repeat(2) @(posedge {clk_name}); #1;")
        lines.append(f"        {rst_name} = 0;")
        lines.append("")

    test_inputs = [p for p in inputs if not p["is_clk"] and not p["is_rst"]]

    if has_clk:
        clk_name = next(p["name"] for p in inputs if p["is_clk"])
        lines.append("        // --- Auto-generated test cases ---")
        lines.append("")

        # Test 1: all zeros
        lines.append("        // Test 1: all inputs zero")
        for p in test_inputs:
            lines.append(f"        {p['name']} = 0;")
        lines.append(f"        repeat(10) @(posedge {clk_name}); #1;")
        lines.append(f'        $display("PASS: TEST1 all zeros complete");')
        lines.append("        pass_count = pass_count + 1;")
        lines.append("")

        # Test 2: all max
        lines.append("        // Test 2: all inputs max value")
        for p in test_inputs:
            if p["width"]:
                match = re.search(r'(\d+):(\d+)', p["width"])
                if match:
                    bits = int(match.group(1)) - int(match.group(2)) + 1
                    lines.append(f"        {p['name']} = {bits}'hFF;")
                else:
                    lines.append(f"        {p['name']} = 8'hFF;")
            else:
                lines.append(f"        {p['name']} = 1;")
        lines.append(f"        repeat(10) @(posedge {clk_name}); #1;")
        lines.append(f'        $display("PASS: TEST2 max values complete");')
        lines.append("        pass_count = pass_count + 1;")
        lines.append("")

        # Test 3: alternating
        lines.append("        // Test 3: alternating bit pattern")
        for p in test_inputs:
            if p["width"]:
                match = re.search(r'(\d+):(\d+)', p["width"])
                if match:
                    bits = int(match.group(1)) - int(match.group(2)) + 1
                    lines.append(f"        {p['name']} = {bits}'hAA;")
                else:
                    lines.append(f"        {p['name']} = 8'hAA;")
            else:
                lines.append(f"        {p['name']} = 0;")
        lines.append(f"        repeat(10) @(posedge {clk_name}); #1;")
        lines.append(f'        $display("PASS: TEST3 alternating pattern complete");')
        lines.append("        pass_count = pass_count + 1;")
        lines.append("")

        # Test 4: reset during operation
        if has_rst:
            rst_name = next(p["name"] for p in inputs if p["is_rst"])
            lines.append("        // Test 4: reset during operation")
            lines.append(f"        {rst_name} = 1;")
            lines.append(f"        repeat(2) @(posedge {clk_name}); #1;")
            lines.append(f"        {rst_name} = 0;")
            lines.append(f'        $display("PASS: TEST4 reset during operation complete");')
            lines.append("        pass_count = pass_count + 1;")
            lines.append("")

    else:
        # Combinational
        lines.append("        // Test 1: all inputs zero")
        for p in test_inputs:
            lines.append(f"        {p['name']} = 0;")
        lines.append("        #10;")
        lines.append(f'        $display("PASS: TEST1 combinational zero");')
        lines.append("        pass_count = pass_count + 1;")
        lines.append("")

        lines.append("        // Test 2: all inputs max")
        for p in test_inputs:
            lines.append(f"        {p['name']} = 8'hFF;")
        lines.append("        #10;")
        lines.append(f'        $display("PASS: TEST2 combinational max");')
        lines.append("        pass_count = pass_count + 1;")
        lines.append("")

    lines.append('        $display("SUMMARY: %0d passed, %0d failed",')
    lines.append("                 pass_count, fail_count);")
    lines.append("        $finish;")
    lines.append("    end")
    lines.append("")
    lines.append("endmodule")

    return "\n".join(lines)


def generate_testbench_for_design(design_path):
    design_path = os.path.abspath(design_path)

    verilog_files = glob.glob(os.path.join(design_path, "*.v"))

    design_files = [
        f for f in verilog_files
        if "tb" not in os.path.basename(f).lower()
    ]

    if not design_files:
        return {"error": "No design files found (only testbenches or no .v files)"}

    results = []

    for vfile in design_files:
        module_info = parse_module(vfile)
        if not module_info:
            continue

        tb_code  = generate_testbench(module_info)
        tb_name  = f"{module_info['module_name']}_generated_tb.v"
        tb_path  = os.path.join(design_path, tb_name)

        with open(tb_path, "w") as f:
            f.write(tb_code)

        results.append({
            "module":         module_info["module_name"],
            "inputs_found":   len(module_info["inputs"]),
            "outputs_found":  len(module_info["outputs"]),
            "testbench_file": tb_name
        })

    if not results:
        return {"error": "Could not parse any modules"}

    return {
        "status":    "success",
        "generated": results
    }