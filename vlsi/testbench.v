`timescale 1ns/1ps

module testbench;

    reg [3:0] a;
    reg [3:0] b;
    wire [4:0] sum;

    integer i;
    integer j;
    integer pass_count;
    integer fail_count;

    alu uut (
        .a(a),
        .b(b),
        .sum(sum)
    );

    initial begin
        $dumpfile("waveform.vcd");
        $dumpvars(0, testbench);

        pass_count = 0;
        fail_count = 0;

        for (i = 0; i < 8; i = i + 1) begin
            for (j = 0; j < 8; j = j + 1) begin
                a = i;
                b = j;
                #5;
                if (sum == (i + j)) begin
                    $display("PASS: %0d + %0d = %0d", a, b, sum);
                    pass_count = pass_count + 1;
                end else begin
                    $display("FAIL: %0d + %0d expected %0d got %0d", a, b, i+j, sum);
                    fail_count = fail_count + 1;
                end
            end
        end

        $display("SUMMARY: %0d passed, %0d failed", pass_count, fail_count);
        $finish;
    end

endmodule