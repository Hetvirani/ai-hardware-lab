`timescale 1ns/1ps

module cpu_tb;

    reg clk;
    reg reset;
    reg [7:0] instruction;
    wire [7:0] result;
    wire zero_flag;

    cpu uut (
        .clk(clk),
        .reset(reset),
        .instruction(instruction),
        .result(result),
        .zero_flag(zero_flag)
    );

    initial clk = 0;
    always #5 clk = ~clk;

    integer pass_count;
    integer fail_count;

    task run_test;
        input [7:0]    instr;
        input [7:0]    expected;
        input [8*20:1] label;
        begin
            @(negedge clk);
            instruction = instr;
            @(posedge clk);
            #1;
            if (result == expected) begin
                $display("PASS: %0s  result=%0d", label, result);
                pass_count = pass_count + 1;
            end else begin
                $display("FAIL: %0s  expected=%0d  got=%0d",
                         label, expected, result);
                fail_count = fail_count + 1;
            end
        end
    endtask

    initial begin
        $dumpfile("waveform.vcd");
        $dumpvars(0, cpu_tb);

        pass_count  = 0;
        fail_count  = 0;
        reset       = 1;
        instruction = 8'b0;

        @(posedge clk); #1;
        @(posedge clk); #1;
        reset = 0;

        // ADD tests
        run_test(8'b00_011_100, 8'd7,  "ADD 3+4    ");
        run_test(8'b00_101_101, 8'd10, "ADD 5+5    ");
        run_test(8'b00_000_000, 8'd0,  "ADD 0+0    ");
        run_test(8'b00_111_001, 8'd8,  "ADD 7+1    ");

        // SUB tests
        run_test(8'b01_111_011, 8'd4,  "SUB 7-3    ");
        run_test(8'b01_101_101, 8'd0,  "SUB 5-5    ");
        run_test(8'b01_110_001, 8'd5,  "SUB 6-1    ");

        // AND tests
        run_test(8'b10_111_101, 8'd5,  "AND 7&5    ");
        run_test(8'b10_110_011, 8'd2,  "AND 6&3    ");
        run_test(8'b10_000_111, 8'd0,  "AND 0&7    ");

        // OR tests
        run_test(8'b11_101_010, 8'd7,  "OR  5|2    ");
        run_test(8'b11_001_110, 8'd7,  "OR  1|6    ");
        run_test(8'b11_000_000, 8'd0,  "OR  0|0    ");

        // Reset test — first run an operation to get non-zero result
        @(negedge clk);
        instruction = 8'b00_111_111;    // ADD 7+7 = 14
        @(posedge clk); #1;             // result latches as 14

        // Assert reset on negedge so it is seen cleanly on next posedge
        @(negedge clk);
        reset = 1;
        @(posedge clk); #1;             // result resets to 0 here
        reset = 0;
        #1;

        if (result == 8'd0) begin
            $display("PASS: RESET clears result");
            pass_count = pass_count + 1;
        end else begin
            $display("FAIL: RESET expected 0 got %0d", result);
            fail_count = fail_count + 1;
        end

        $display("SUMMARY: %0d passed, %0d failed", pass_count, fail_count);
        $finish;
    end

endmodule