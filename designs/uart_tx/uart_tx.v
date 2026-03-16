module uart_tx(
    input        clk,
    input        reset,
    input        tx_start,
    input  [7:0] tx_data,
    output reg   tx_out,
    output reg   tx_busy
);

    parameter CLKS_PER_BIT = 10;

    reg [3:0]  bit_index;
    reg [7:0]  data_reg;
    reg [15:0] clk_count;
    reg [1:0]  state;

    localparam IDLE  = 2'b00;
    localparam START = 2'b01;
    localparam DATA  = 2'b10;
    localparam STOP  = 2'b11;

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            state     <= IDLE;
            tx_out    <= 1;
            tx_busy   <= 0;
            clk_count <= 0;
            bit_index <= 0;
        end else begin
            case (state)
                IDLE: begin
                    tx_out  <= 1;
                    tx_busy <= 0;
                    if (tx_start) begin
                        data_reg  <= tx_data;
                        state     <= START;
                        tx_busy   <= 1;
                        clk_count <= 0;
                    end
                end
                START: begin
                    tx_out <= 0;
                    if (clk_count < CLKS_PER_BIT - 1) begin
                        clk_count <= clk_count + 1;
                    end else begin
                        clk_count <= 0;
                        bit_index <= 0;
                        state     <= DATA;
                    end
                end
                DATA: begin
                    tx_out <= data_reg[bit_index];
                    if (clk_count < CLKS_PER_BIT - 1) begin
                        clk_count <= clk_count + 1;
                    end else begin
                        clk_count <= 0;
                        if (bit_index < 7) begin
                            bit_index <= bit_index + 1;
                        end else begin
                            state <= STOP;
                        end
                    end
                end
                STOP: begin
                    tx_out <= 1;
                    if (clk_count < CLKS_PER_BIT - 1) begin
                        clk_count <= clk_count + 1;
                    end else begin
                        state   <= IDLE;
                        tx_busy <= 0;
                    end
                end
            endcase
        end
    end

endmodule