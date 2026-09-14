ALTER TABLE orders DROP CONSTRAINT orders_cluster_check;
ALTER TABLE orders ADD CONSTRAINT orders_cluster_check CHECK(cluster IN ('solana:devnet','solana:mainnet'));
ALTER TABLE return_reservations DROP CONSTRAINT return_reservations_cluster_check;
ALTER TABLE return_reservations ADD CONSTRAINT return_reservations_cluster_check CHECK(cluster IN ('solana:devnet','solana:mainnet'));
