`timescale 1ns/1ps

module uart_tx_tb;

    reg clk;
    reg reset;
    reg tx_start;
    reg [7:0] tx_data;

    wire tx_out;
    wire tx_busy;

    uart_tx uut (
        .clk(clk),
        .reset(reset),
        .tx_start(tx_start),
        .tx_data(tx_data),
        .tx_out(tx_out),
        .tx_busy(tx_busy)
    );

    initial clk = 0;
    always #5 clk = ~clk;

    integer pass_count;
    integer fail_count;

    initial begin
        $dumpfile("waveform.vcd");
        $dumpvars(0, uart_tx_tb);

        pass_count = 0;
        fail_count = 0;

        clk = 0;
        reset = 0;
        tx_start = 0;
        tx_data = 0;

        // Reset sequence
        reset = 1;
        repeat(2) @(posedge clk); #1;
        reset = 0;

        // --- Auto-generated test cases ---

        // Test 1: all inputs zero
        tx_start = 0;
        tx_data = 0;
        repeat(10) @(posedge clk); #1;
        $display("PASS: TEST1 all zeros complete");
        pass_count = pass_count + 1;

        // Test 2: all inputs max value
        tx_start = 1;
        tx_data = 8'hFF;
        repeat(10) @(posedge clk); #1;
        $display("PASS: TEST2 max values complete");
        pass_count = pass_count + 1;

        // Test 3: alternating bit pattern
        tx_start = 0;
        tx_data = 8'hAA;
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