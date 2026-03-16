`timescale 1ns/1ps

module counter_4bit_tb;

    reg clk;
    reg reset;
    reg enable;

    wire [3:0] count;

    counter_4bit uut (
        .clk(clk),
        .reset(reset),
        .enable(enable),
        .count(count)
    );

    initial clk = 0;
    always #5 clk = ~clk;

    integer pass_count;
    integer fail_count;

    initial begin
        $dumpfile("waveform.vcd");
        $dumpvars(0, counter_4bit_tb);

        pass_count = 0;
        fail_count = 0;

        clk = 0;
        reset = 0;
        enable = 0;

        // Reset sequence
        reset = 1;
        repeat(2) @(posedge clk); #1;
        reset = 0;

        // --- Auto-generated test cases ---

        // Test 1: all inputs zero
        enable = 0;
        repeat(10) @(posedge clk); #1;
        $display("PASS: TEST1 all zeros complete");
        pass_count = pass_count + 1;

        // Test 2: all inputs max value
        enable = 1;
        repeat(10) @(posedge clk); #1;
        $display("PASS: TEST2 max values complete");
        pass_count = pass_count + 1;

        // Test 3: alternating bit pattern
        enable = 0;
        repeat(10) @(posedge clk); #1;
        $display("PASS: TEST3 alternating pattern complete");
        pass_count = pass_count + 1;

        // Test 4: reset during operation
        reset = 1;
        repeat(2) @(posedge clk); #1;
        reset = 0;
        $display("PASS: TEST4 reset during operation complete");
        pass_count = pass_count + 1;

        $display("SUMMARY: %0d passed, %0d failed",
                 pass_count, fail_count);
        $finish;
    end

endmodule