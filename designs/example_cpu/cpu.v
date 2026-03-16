module cpu(
    input clk,
    input reset,
    input [7:0] instruction,
    output reg [7:0] result,
    output reg zero_flag
);

    wire [1:0] opcode;
    wire [7:0] op_a;
    wire [7:0] op_b;

    assign opcode = instruction[7:6];
    assign op_a   = {5'b0, instruction[5:3]};
    assign op_b   = {5'b0, instruction[2:0]};

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            result    <= 8'b0;
            zero_flag <= 1'b1;   // zero_flag is 1 when result is 0
        end else begin
            case (opcode)
                2'b00: result <= op_a + op_b;
                2'b01: result <= op_a - op_b;
                2'b10: result <= op_a & op_b;
                2'b11: result <= op_a | op_b;
            endcase
            zero_flag <= (result == 8'b0);
        end
    end

endmodule