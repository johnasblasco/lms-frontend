import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/utils/axios';

interface Book {
    book_id: number;
    title: string;
}

interface Transaction {
    transaction_id: number;
    book_id: number;
    borrower_name: string;
    borrow_date: string;
    due_date: string;
    return_date: string | null;
    status: 'borrowed' | 'returned' | 'overdue';
    is_archived: boolean;
    book?: {
        bookid: number;
        title: string;
        author: string;
    };
}

interface PaginationInfo {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Pagination and filtering states
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        per_page: 10,
        current_page: 1,
        last_page: 1
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [formData, setFormData] = useState({
        book_id: '',
        borrower_name: '',
        borrow_date: '',
        due_date: '',
        return_date: '',
        status: 'borrowed' as Transaction['status']
    });

    // Status options with colors
    const statusOptions = [
        { value: 'borrowed', label: 'Borrowed', color: 'bg-blue-100 text-blue-800' },
        { value: 'returned', label: 'Returned', color: 'bg-green-100 text-green-800' },
        { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
    ];

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch transactions with pagination and filters
    useEffect(() => {
        fetchTransactions();
    }, [debouncedSearch, selectedStatus, pagination.current_page, pagination.per_page]);

    // Fetch available books for dropdown
    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchTransactions = async () => {
        try {
            const params = new URLSearchParams({
                page: pagination.current_page.toString(),
                per_page: pagination.per_page.toString(),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(selectedStatus && { status: selectedStatus })
            });

            const response = await api.get(`/transactions?${params}`);
            if (response.data.success) {
                setTransactions(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            console.error('Error fetching transactions:', error);
            setError('Failed to fetch transactions');
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await api.get('/dropdown/books');
            if (response.data.success) {
                setBooks(response.data.data);
            }
        } catch (error: any) {
            console.error('Error fetching books:', error);
            setError('Failed to fetch books');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const submitData = {
                ...formData,
                return_date: formData.return_date || null
            };

            if (editingTransaction) {
                // Update transaction
                const response = await api.post(`/update/transactions/${editingTransaction.transaction_id}`, submitData);

                if (response.data.success) {
                    fetchTransactions(); // Refresh the list
                    resetForm();
                } else {
                    setError(response.data.message || 'Failed to update transaction');
                }
            } else {
                // Create new transaction
                const response = await api.post('/create/transactions', submitData);

                if (response.data.success) {
                    fetchTransactions(); // Refresh the list
                    resetForm();
                } else {
                    setError(response.data.message || 'Failed to create transaction');
                }
            }
        } catch (error: any) {
            console.error('Error saving transaction:', error);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)[0] as string[];
                setError(firstError[0] || 'Validation failed');
            } else {
                setError(error.response?.data?.message || 'Failed to save transaction');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            book_id: '',
            borrower_name: '',
            borrow_date: '',
            due_date: '',
            return_date: '',
            status: 'borrowed'
        });
        setEditingTransaction(null);
        setIsDialogOpen(false);
        setError('');
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            book_id: transaction.book_id.toString(),
            borrower_name: transaction.borrower_name,
            borrow_date: transaction.borrow_date.split('T')[0],
            due_date: transaction.due_date.split('T')[0],
            return_date: transaction.return_date ? transaction.return_date.split('T')[0] : '',
            status: transaction.status
        });
        setIsDialogOpen(true);
    };

    const handleArchive = async (id: number) => {
        if (!confirm('Are you sure you want to archive this transaction?')) return;

        try {
            const response = await api.post(`/archive/transactions/${id}`);
            if (response.data.success) {
                fetchTransactions(); // Refresh the list
            } else {
                setError('Failed to archive transaction');
            }
        } catch (error: any) {
            console.error('Error archiving transaction:', error);
            setError('Failed to archive transaction');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-set return date when status is changed to returned
        if (name === 'status' && value === 'returned' && !formData.return_date) {
            setFormData(prev => ({
                ...prev,
                return_date: new Date().toISOString().split('T')[0]
            }));
        }
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const handlePerPageChange = (value: string) => {
        setPagination(prev => ({
            ...prev,
            per_page: parseInt(value),
            current_page: 1
        }));
    };

    const getStatusBadge = (status: Transaction['status']) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return (
            <Badge variant="outline" className={statusOption?.color}>
                {statusOption?.label}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getBookTitle = (bookId: number) => {
        const transactionBook = transactions.find(t => t.book_id === bookId)?.book;
        if (transactionBook) {
            return transactionBook.title;
        }

        const book = books.find(b => b.book_id === bookId);
        return book ? book.title : 'Unknown Book';
    };

    // Generate page numbers for pagination
    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.last_page, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };


    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Transactions Management</h1>
                    <p className="text-gray-600">Track book borrowing and returns</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Transaction
                </Button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            {/* Filters Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search by book title or borrower name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">All Status</SelectItem>
                            {statusOptions.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>


                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Book Title</TableHead>
                            <TableHead>Borrower Name</TableHead>
                            <TableHead>Borrow Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Return Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    No transactions found. {pagination.total === 0 ? 'Create your first transaction to get started.' : 'Try adjusting your filters.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((transaction) => (
                                <TableRow key={transaction.transaction_id}>
                                    <TableCell className="font-mono text-sm">{transaction.transaction_id}</TableCell>
                                    <TableCell className="font-medium">
                                        {transaction.book?.title || getBookTitle(transaction.book_id)}
                                    </TableCell>
                                    <TableCell>{transaction.borrower_name}</TableCell>
                                    <TableCell>{formatDate(transaction.borrow_date)}</TableCell>
                                    <TableCell>{formatDate(transaction.due_date)}</TableCell>
                                    <TableCell>
                                        {transaction.return_date ? formatDate(transaction.return_date) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(transaction.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(transaction)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleArchive(transaction.transaction_id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                            {pagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            {generatePageNumbers().map(page => (
                                <Button
                                    key={page}
                                    variant={pagination.current_page === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Transaction Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
                        <DialogDescription>
                            {editingTransaction ? 'Update the transaction details below.' : 'Fill in the details to record a new book transaction.'}
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {/* Book Selection */}
                            <div className="grid gap-2">
                                <Label htmlFor="book_id">Book *</Label>
                                <Select
                                    value={formData.book_id}
                                    onValueChange={(value) => handleSelectChange('book_id', value)}
                                    required
                                    disabled={isLoading || (editingTransaction !== null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a book" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {books.map((book) => (
                                            <SelectItem key={book.book_id} value={book.book_id.toString()}>
                                                {book.title} 
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!editingTransaction && (
                                    <p className="text-sm text-gray-500">
                                        Only available books are shown for new transactions
                                    </p>
                                )}
                            </div>

                            {/* Borrower Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="borrower_name">Borrower Name *</Label>
                                <Input
                                    id="borrower_name"
                                    name="borrower_name"
                                    value={formData.borrower_name}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="borrow_date">Borrow Date *</Label>
                                    <Input
                                        id="borrow_date"
                                        name="borrow_date"
                                        type="date"
                                        value={formData.borrow_date}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="due_date">Due Date *</Label>
                                    <Input
                                        id="due_date"
                                        name="due_date"
                                        type="date"
                                        value={formData.due_date}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isLoading}
                                        min={formData.borrow_date}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="return_date">Return Date</Label>
                                    <Input
                                        id="return_date"
                                        name="return_date"
                                        type="date"
                                        value={formData.return_date}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                        min={formData.borrow_date}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleSelectChange('status', value as Transaction['status'])}
                                    required
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : (editingTransaction ? 'Update Transaction' : 'Create Transaction')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}