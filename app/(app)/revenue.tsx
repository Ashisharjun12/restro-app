
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { MainTemplate } from '../../components/templates/MainTemplate';
import { Typography } from '../../components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NetRevenueCard, TotalOrdersCard } from '../../components/molecules/RevenueCards';

const STATUS_COLOR: Record<string, string> = {
    pending:          '#f27f0d',
    preparing:        '#3498db',
    ready:            '#2ecc71',
    out_for_delivery: '#9b59b6',
    delivered:        '#27ae60',
    cancelled:        '#e74c3c',
};

export default function Revenue() {
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('today'); // today, week, month, all, custom
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [pickingDate, setPickingDate] = useState<'start' | 'end' | null>(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const router = useRouter();

    const fetchStats = async (pageNum = 1) => {
        try {
            if (stats) setIsFetching(true);
            else setLoading(true);
            let startStr, endStr;
            
            if (filter === 'custom') {
                const s = new Date(startDate);
                s.setHours(0,0,0,0);
                const e = new Date(endDate);
                e.setHours(23,59,59,999);
                startStr = s.toISOString();
                endStr = e.toISOString();
            } else if (filter !== 'all') {
                const now = new Date();
                if (filter === 'today') {
                    const s = new Date(now);
                    s.setHours(0,0,0,0);
                    const e = new Date(now);
                    e.setHours(23,59,59,999);
                    startStr = s.toISOString();
                    endStr = e.toISOString();
                } else if (filter === 'week') {
                    const s = new Date(now);
                    s.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                    s.setHours(0,0,0,0);
                    startStr = s.toISOString();
                    endStr = new Date().toISOString();
                } else if (filter === 'month') {
                    const s = new Date(now.getFullYear(), now.getMonth(), 1);
                    s.setHours(0,0,0,0);
                    startStr = s.toISOString();
                    endStr = new Date().toISOString();
                }
            }

            const res = await api.get('/restaurants/analytics/revenue', {
                params: { 
                    startDate: startStr, 
                    endDate: endStr, 
                    page: pageNum, 
                    limit: 15,
                    search: debouncedSearch || undefined
                }
            });
            setStats(res.data);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch revenue stats", error);
        } finally {
            setLoading(false);
            setIsFetching(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500); // 500ms delay like Zomato/modern search
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchStats(1);
    }, [filter, startDate, endDate, debouncedSearch]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats(1);
    };

    const onDateChange = (event: any, date?: Date) => {
        const currentPicking = pickingDate;
        setPickingDate(null);
        if (date) {
            if (currentPicking === 'start') {
                setStartDate(date);
                if (date > endDate) setEndDate(date);
            } else if (currentPicking === 'end') {
                setEndDate(date);
                if (date < startDate) setStartDate(date);
            }
            setFilter('custom');
        }
    };


    const renderHeader = () => (
        <View style={styles.filterContainer}>
            {['today', 'week', 'month', 'all', 'custom'].map((f) => (
                <TouchableOpacity 
                    key={f}
                    style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                    onPress={() => setFilter(f)}
                >
                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <MainTemplate title="Revenue">
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#f27f0d" />
                </View>
            </MainTemplate>
        );
    }

    return (
        <MainTemplate title="Revenue Analytics" showHeader={false} noPadding>
            <View style={styles.container}>
                {/* Custom Header like menu page */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={28} color="#f27f0d" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Revenue</Text>
                    <View style={{ width: 28 }} />
                </View>

                {pickingDate && (
                    <DateTimePicker
                        value={pickingDate === 'start' ? startDate : endDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                <ScrollView 
                    contentContainerStyle={styles.scroll}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f27f0d" />}
                    showsVerticalScrollIndicator={false}
                >
                <View style={{ paddingHorizontal: 20 }}>
                    {renderHeader()}

                    {filter === 'custom' && (
                        <View style={styles.rangeIndicator}>
                            <TouchableOpacity style={styles.dateSelector} onPress={() => setPickingDate('start')}>
                                <Typography variant="caption" color="#888">FROM</Typography>
                                <Typography variant="body" color="#fff">{startDate.toLocaleDateString()}</Typography>
                            </TouchableOpacity>
                            <Ionicons name="arrow-forward" size={16} color="#444" style={{ marginHorizontal: 10 }} />
                            <TouchableOpacity style={styles.dateSelector} onPress={() => setPickingDate('end')}>
                                <Typography variant="caption" color="#888">TO</Typography>
                                <Typography variant="body" color="#fff">{endDate.toLocaleDateString()}</Typography>
                            </TouchableOpacity>
                        </View>
                    )}


                    <View style={styles.statsGrid}>
                        <NetRevenueCard value={stats?.netRevenue || 0} label="NET REVENUE" />
                        <TotalOrdersCard value={stats?.totalOrders || 0} label="TOTAL ORDERS" />
                    </View>
                </View>

                {stats?.mostOrdered?.length > 0 && (
                    <View style={styles.mostOrderedSection}>
                        <Typography variant="h3" style={styles.sectionTitle}>Top Menu Products</Typography>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mostOrderedScroll}>
                            {stats.mostOrdered.map((item: any, idx: number) => (
                                <View key={idx} style={styles.mostOrderedCard}>
                                    <Image source={{ uri: item.image }} style={styles.productImageMini} />
                                    <View style={styles.mostOrderedInfo}>
                                        <Typography variant="body" style={styles.productName} numberOfLines={1}>{item.name}</Typography>
                                        <Typography variant="caption" color="#f27f0d">{item.count} Sold</Typography>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}


                {/* Daily Breakdown Table */}
                {stats?.trend?.length > 0 && (
                    <View style={styles.breakdownSection}>
                        <Typography variant="h3" style={styles.sectionTitle}>Daily Breakdown</Typography>
                        <View style={styles.tableHeader}>
                            <Typography variant="caption" color="#666" style={{ flex: 1.5 }}>DAY</Typography>
                            <Typography variant="caption" color="#666" style={{ flex: 1, textAlign: 'center' }}>ORDERS</Typography>
                            <Typography variant="caption" color="#666" style={{ flex: 1.2, textAlign: 'right' }}>REVENUE</Typography>
                        </View>
                        {stats.trend.slice(-7).reverse().map((day: any, idx: number) => {
                            const date = new Date(day._id);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                            return (
                                <View key={idx} style={styles.tableRow}>
                                    <Typography variant="body" style={{ flex: 1.5, fontWeight: '500' }}>{dayName}</Typography>
                                    <Typography variant="body" color="#fff" style={{ flex: 1, textAlign: 'center' }}>{day.orders}</Typography>
                                    <Typography variant="body" color="#f27f0d" style={{ flex: 1.2, textAlign: 'right', fontWeight: 'bold' }}>₹{day.revenue.toLocaleString()}</Typography>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                    <View style={styles.searchSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Typography variant="h3" style={{ flex: 1 }}>Recent Order Details</Typography>
                            {isFetching && <ActivityIndicator color="#f27f0d" size="small" />}
                        </View>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#666" />
                            <TextInput 
                                placeholder="Search by Order ID (e.g. #ORD-1)"
                                placeholderTextColor="#666"
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {stats?.orders?.length > 0 ? (
                        stats.orders.map((order: any) => (
                            <TouchableOpacity 
                                key={order._id} 
                                style={styles.orderCard}
                                onPress={() => router.push(`/(app)/order/${order._id}`)}
                            >
                                <View style={styles.orderHeader}>
                                    <Typography variant="h3" style={{ fontSize: 16 }}>{order.orderId}</Typography>
                                    <Typography variant="h3" color="#f27f0d">₹{order.totalAmount}</Typography>
                                </View>
                                
                                <View style={styles.orderDivider} />
                                
                                {order.items.map((item: any, idx: number) => (
                                    <View key={idx} style={styles.itemRow}>
                                        <Image source={{ uri: item.product?.image }} style={styles.itemImageThumb} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Typography variant="body" style={{ fontWeight: 'bold' }}>{item.product?.name || 'Item'}</Typography>
                                            <Typography variant="caption" color="#888">Qty: {item.quantity}</Typography>
                                        </View>
                                        <Typography variant="body" color="#fff">₹{item.price * item.quantity}</Typography>
                                    </View>
                                ))}
                                
                                <View style={styles.orderFooter}>
                                    <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[order.status] || '#888' }]}>
                                        <Text style={[styles.statusText, { color: STATUS_COLOR[order.status] || '#888' }]}>{order.status}</Text>
                                    </View>
                                    <View style={styles.viewDetailsLink}>
                                        <Typography variant="caption" color="#f27f0d" style={{ fontWeight: '700' }}>VIEW FULL DETAILS</Typography>
                                        <Ionicons name="chevron-forward" size={12} color="#f27f0d" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.empty}>
                            <Ionicons name="receipt-outline" size={50} color="#333" />
                            <Typography variant="body" color="#555" style={{ marginTop: 10 }}>No orders found for this period</Typography>
                        </View>
                    )}
                </View>

                {/* Pagination Controls */}
                {stats?.pagination?.pages > 1 && (
                    <View style={styles.pagination}>
                        <TouchableOpacity 
                            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]} 
                            onPress={() => page > 1 && fetchStats(page - 1)}
                            disabled={page === 1}
                        >
                            <Ionicons name="chevron-back" size={20} color={page === 1 ? "#444" : "#fff"} />
                            <Text style={[styles.pageText, page === 1 && { color: '#444' }]}>Prev</Text>
                        </TouchableOpacity>
                        
                        <Typography variant="body" color="#888">Page {page} of {stats.pagination.pages}</Typography>
                        
                        <TouchableOpacity 
                            style={[styles.pageBtn, page === stats.pagination.pages && styles.pageBtnDisabled]} 
                            onPress={() => page < stats.pagination.pages && fetchStats(page + 1)}
                            disabled={page === stats.pagination.pages}
                        >
                            <Text style={[styles.pageText, page === stats.pagination.pages && { color: '#444' }]}>Next Page</Text>
                            <Ionicons name="chevron-forward" size={20} color={page === stats.pagination.pages ? "#444" : "#fff"} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    </MainTemplate>
);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold'
    },
    notifBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2A1F16',
        justifyContent: 'center',
        alignItems: 'center'
    },
    scroll: {
        paddingBottom: 100
    },
    rangeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333'
    },
    dateSelector: {
        flex: 1,
        alignItems: 'center'
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        marginTop: 10
    },
    filterBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8
    },
    filterBtnActive: {
        backgroundColor: '#f27f0d'
    },
    filterText: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold'
    },
    filterTextActive: {
        color: '#fff'
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 15
    },
    card: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222'
    },
    mostOrderedSection: {
        marginTop: 30,
    },
    sectionTitle: {
        paddingHorizontal: 20,
        marginBottom: 15
    },
    mostOrderedScroll: {
        paddingLeft: 20,
    },
    mostOrderedCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        marginRight: 15,
        width: 140,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222'
    },
    productImageMini: {
        width: '100%',
        height: 100,
        backgroundColor: '#333'
    },
    mostOrderedInfo: {
        padding: 12
    },
    productName: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2
    },
    orderCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#222'
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    orderDivider: {
        height: 1,
        backgroundColor: '#222',
        marginVertical: 12
    },
    searchSection: {
        marginBottom: 20
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#333'
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        marginLeft: 10,
        fontSize: 14,
        paddingVertical: 8
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    itemImageThumb: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#333'
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12
    },
    statusBadge: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    viewDetailsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    deliveredBadge: {
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.2)'
    },
    deliveredText: {
        color: '#2ecc71',
        fontSize: 10,
        fontWeight: 'bold'
    },
    breakdownSection: {
        marginTop: 35,
        backgroundColor: '#111',
        paddingVertical: 20
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 15,
        opacity: 0.6
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#1c1c1c',
        alignItems: 'center'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    empty: {
        alignItems: 'center',
        marginTop: 40,
        opacity: 0.5
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 30,
        borderTopWidth: 1,
        borderTopColor: '#222',
        marginTop: 20
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333'
    },
    pageBtnDisabled: {
        borderColor: '#222',
        backgroundColor: '#151515'
    },
    pageText: {
        color: '#fff',
        fontWeight: 'bold',
        marginHorizontal: 5
    }
});
