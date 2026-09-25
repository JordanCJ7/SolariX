package com.solarix.mobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.solarix.mobile.data.local.entities.CachedBookingEntity

@Dao
interface BookingDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(booking: CachedBookingEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(bookings: List<CachedBookingEntity>)

    @Query("SELECT * FROM cached_bookings WHERE prosumerNIC = :nic ORDER BY reservationDate DESC")
    suspend fun getBookingsByProsumer(nic: String): List<CachedBookingEntity>

    @Query("SELECT * FROM cached_bookings WHERE id = :id LIMIT 1")
    suspend fun getBookingById(id: String): CachedBookingEntity?

    @Query("DELETE FROM cached_bookings WHERE prosumerNIC = :nic")
    suspend fun clearBookingsForProsumer(nic: String)

    @Query("DELETE FROM cached_bookings")
    suspend fun clearAll()
}
