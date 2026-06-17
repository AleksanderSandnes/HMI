package repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import entity.UserAccount;

/**
 * Read-only repository over the shared {@code users} collection, used by the solar backfill
 * job to resolve Growatt credentials and push tokens.
 */
public interface UserAccountRepository extends MongoRepository<UserAccount, String> {
}
