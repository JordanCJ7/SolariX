package com.solarix.mobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.solarix.mobile.data.local.entities.UserEntity

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(user: UserEntity)

    @Update
    suspend fun update(user: UserEntity)

    @Query("SELECT * FROM users WHERE nic = :nic LIMIT 1")
    suspend fun getUserByNic(nic: String): UserEntity?

    @Query("SELECT * FROM users ORDER BY lastLoginAt DESC LIMIT 1")
    suspend fun getActiveUser(): UserEntity?

    @Query("DELETE FROM users WHERE nic = :nic")
    suspend fun deleteUser(nic: String)

    @Query("DELETE FROM users")
    suspend fun clearAll()
}
