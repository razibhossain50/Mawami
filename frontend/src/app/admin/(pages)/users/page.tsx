"use client"
import { FormInput, FormSelect } from "@/components/ui/form-fields";
import type { SVGProps } from "react";
import type { Selection, ChipProps, SortDescriptor } from "@heroui/react";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Table, Button, Dropdown, Chip, Label, Modal } from "@heroui/react";
import { PageNav } from "@/components/ui/page-nav";
import { Plus, EllipsisVertical, Search, ChevronDown, Trash2 } from "lucide-react";
import { logger } from '@/services/logger';
import { adminApi } from '@/services/api-client';
import { handleApiError } from '@/services/error-handler';


type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number;
};


function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}


// Columns based on your database schema

const columns = [
    { name: "ID", uid: "id", sortable: true },
    { name: "FULL NAME", uid: "fullName", sortable: true },
    { name: "EMAIL", uid: "email", sortable: true },
    { name: "ROLE", uid: "role", sortable: true },
    { name: "CREATED AT", uid: "createdAt", sortable: true },
    { name: "UPDATED AT", uid: "updatedAt", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

// Role options based on your database

const roleOptions = [
    { name: "User", uid: "user" },
    { name: "Admin", uid: "admin" },
    { name: "Superadmin", uid: "superadmin" },
];

// User interface based on your database schema
interface DatabaseUser {
    id: number;
    email: string | null;
    username: string | null;
    password: string; // Won't display this
    role: string;
    createdAt: string;
    updatedAt: string;
    fullName: string | null;
}

const roleColorMap: Record<string, ChipProps["color"]> = {
    user: "default",
    admin: "accent",
    superadmin: "success",
};

export default function Users() {
    const [users, setUsers] = React.useState<DatabaseUser[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [filterValue, setFilterValue] = React.useState("");
    const [roleFilter, setRoleFilter] = React.useState<Selection>("all");
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "id",
        direction: "ascending",
    });
    const [page, setPage] = React.useState(1);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [userToDelete, setUserToDelete] = React.useState<DatabaseUser | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Add user modal state
    const [addUserModalOpen, setAddUserModalOpen] = React.useState(false);
    const [isCreatingUser, setIsCreatingUser] = React.useState(false);
    // Signed-in admin, from the admin auth context
    const { user: currentUser } = useAuth();

    // Add user form state
    const [newUserForm, setNewUserForm] = React.useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

    // Edit user modal state
    const [editUserModalOpen, setEditUserModalOpen] = React.useState(false);
    const [userToEdit, setUserToEdit] = React.useState<DatabaseUser | null>(null);
    const [isUpdatingUser, setIsUpdatingUser] = React.useState(false);

    // Edit user form state
    const [editUserForm, setEditUserForm] = React.useState({
        fullName: '',
        email: '',
        role: ''
    });
    const [editFormErrors, setEditFormErrors] = React.useState<Record<string, string>>({});


    // Fetch all users from API
    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                // Get admin authentication token
                const token = localStorage.getItem('admin_user_access_token');

                if (!token) {
                    setError('No authentication token found. Please login as admin.');
                    setLoading(false);
                    return;
                }

                logger.info('Fetching users', { hasToken: !!token }, 'AdminUsersPage');

                const data = await adminApi.get('/users') as DatabaseUser[];
                setUsers(data);
                logger.info('Successfully fetched users', { count: data.length }, 'AdminUsersPage');
            } catch (err) {
                const appError = handleApiError(err, 'AdminUsersPage');
                logger.error('Error fetching users', appError, 'AdminUsersPage');
                setError(appError.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Handle user deletion
    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            setIsDeleting(true);
            // Get admin authentication token
            const token = localStorage.getItem('admin_user_access_token');

            logger.info('Delete user initiated', {
                currentUserRole: currentUser?.role,
                hasToken: !!token,
                userToDelete: { id: userToDelete.id, fullName: userToDelete.fullName }
            }, 'AdminUsersPage');

            if (!token) {
                logger.error('No authentication token found for delete operation', undefined, 'AdminUsersPage');
                alert('No authentication token found. Please login again.');
                return;
            }

            if (currentUser?.role !== 'superadmin') {
                alert('Only superadmin can delete users. Your role: ' + currentUser?.role);
                return;
            }

            await adminApi.delete(`/users/${userToDelete.id}`);
            
            // Remove user from local state
            setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
            setDeleteModalOpen(false);
            setUserToDelete(null);
            logger.info('User deleted successfully', { userId: userToDelete.id }, 'AdminUsersPage');
            alert('User deleted successfully!');
        } catch (error) {
            const appError = handleApiError(error, 'AdminUsersPage');
            logger.error('Error deleting user', appError, 'AdminUsersPage');
            alert('Network error. Please check if the backend server is running.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Validate add user form
    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!newUserForm.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        if (!newUserForm.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!newUserForm.password) {
            errors.password = 'Password is required';
        } else if (newUserForm.password.length < 5) {
            errors.password = 'Password must be at least 5 characters long';
        }

        if (!newUserForm.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (newUserForm.password !== newUserForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle add user form submission
    const handleAddUser = async () => {
        if (!validateForm()) return;

        try {
            setIsCreatingUser(true);
            // Get admin authentication token
            const token = localStorage.getItem('admin_user_access_token');

            if (!token) {
                logger.error('No authentication token found for create user operation', undefined, 'AdminUsersPage');
                return;
            }

            const newUser = await adminApi.post('/users', {
                fullName: newUserForm.fullName,
                email: newUserForm.email,
                password: newUserForm.password,
                confirmPassword: newUserForm.confirmPassword,
                role: 'admin' // Set role to admin as specified
            }) as DatabaseUser;

            // Add new user to local state
            setUsers(prev => [...prev, newUser]);
            // Reset form and close modal
            setNewUserForm({
                fullName: '',
                email: '',
                password: '',
                confirmPassword: ''
            });
            setFormErrors({});
            setAddUserModalOpen(false);
            logger.info('User created successfully', { userId: newUser.id }, 'AdminUsersPage');
        } catch (error) {
            const appError = handleApiError(error, 'AdminUsersPage');
            logger.error('Error creating user', appError, 'AdminUsersPage');
            alert(appError.message || 'Error creating user. Please try again.');
        } finally {
            setIsCreatingUser(false);
        }
    };

    // Handle form input changes
    const handleFormChange = (field: string, value: string) => {
        setNewUserForm(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Handle edit form input changes
    const handleEditFormChange = (field: string, value: string) => {
        setEditUserForm(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field when user starts typing
        if (editFormErrors[field]) {
            setEditFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate edit user form
    const validateEditForm = () => {
        const errors: Record<string, string> = {};

        if (!editUserForm.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        if (!editUserForm.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserForm.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!editUserForm.role) {
            errors.role = 'Role is required';
        }

        setEditFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle edit user form submission
    const handleEditUser = async () => {
        if (!validateEditForm() || !userToEdit) return;

        try {
            setIsUpdatingUser(true);
            // Get admin authentication token
            const token = localStorage.getItem('admin_user_access_token');

            if (!token) {
                logger.error('No authentication token found for update user operation', undefined, 'AdminUsersPage');
                return;
            }

            const updatedUser = await adminApi.put(`/users/${userToEdit.id}`, {
                fullName: editUserForm.fullName,
                email: editUserForm.email,
                role: editUserForm.role
            }) as Partial<DatabaseUser>;
            // Update user in local state
            setUsers(prev => prev.map(user =>
                user.id === userToEdit.id
                    ? { ...user, ...updatedUser }
                    : user
            ));
            // Reset form and close modal
            setEditUserForm({
                fullName: '',
                email: '',
                role: ''
            });
            setEditFormErrors({});
            setEditUserModalOpen(false);
            setUserToEdit(null);
            logger.info('User updated successfully', { userId: userToEdit.id }, 'AdminUsersPage');
        } catch (error) {
            const appError = handleApiError(error, 'AdminUsersPage');
            logger.error('Error updating user', appError, 'AdminUsersPage');
            alert(appError.message || 'Error updating user. Please try again.');
        } finally {
            setIsUpdatingUser(false);
        }
    };

    // Handle opening edit modal
    const handleOpenEditModal = (user: DatabaseUser) => {
        setUserToEdit(user);
        setEditUserForm({
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role
        });
        setEditFormErrors({});
        setEditUserModalOpen(true);
    };

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        return columns;
    }, []);

    const filteredItems = React.useMemo(() => {
        let filteredUsers = [...users];

        if (hasSearchFilter) {
            filteredUsers = filteredUsers.filter((user) =>
                (user.fullName?.toLowerCase().includes(filterValue.toLowerCase()) || false) ||
                (user.email?.toLowerCase().includes(filterValue.toLowerCase()) || false)
            );
        }
        if (roleFilter !== "all" && Array.from(roleFilter).length !== roleOptions.length) {
            filteredUsers = filteredUsers.filter((user) =>
                Array.from(roleFilter).includes(user.role),
            );
        }

        return filteredUsers;
    }, [users, filterValue, roleFilter, hasSearchFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const sortedItems = React.useMemo(() => {
        return [...filteredItems].sort((a: DatabaseUser, b: DatabaseUser) => {
            let first: string | number = a[sortDescriptor.column as keyof DatabaseUser] as string | number;
            let second: string | number = b[sortDescriptor.column as keyof DatabaseUser] as string | number;

            // Handle null values
            if (first === null || first === undefined) first = "";
            if (second === null || second === undefined) second = "";

            // Convert to string for comparison if needed
            if (typeof first === 'string') first = first.toLowerCase();
            if (typeof second === 'string') second = second.toLowerCase();

            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, filteredItems]);

    // Current page of the sorted results
    const pageItems = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedItems.slice(start, start + rowsPerPage);
    }, [page, sortedItems, rowsPerPage]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderCell = React.useCallback((user: DatabaseUser, columnKey: React.Key) => {
        const cellValue = user[columnKey as keyof DatabaseUser];

        switch (columnKey) {
            case "fullName":
                return (
                    <div>
                        {user.fullName || "No name"}
                    </div>

                );
            case "email":
                return (
                    <div className="flex flex-col">
                        <span className="text-small">
                            {user.email || "No email"}
                        </span>
                    </div>
                );
            case "role":
                return (
                    <Chip
                        className="capitalize"
                        color={roleColorMap[user.role] || "default"}
                        size="sm"
                        variant="soft"
                    >
                        {user.role}
                    </Chip>
                );
            case "createdAt":
            case "updatedAt":
                return (
                    <span className="text-small">
                        {formatDate(cellValue as string)}
                    </span>
                );
            case "actions":
                // Only show actions dropdown for superadmins
                if (currentUser?.role === 'superadmin') {
                    return (
                        <div className="relative flex justify-end items-center gap-2">
                            <Dropdown>
                                <Button variant="ghost" isIconOnly size="sm" aria-label={`Actions for ${user.fullName || user.email}`}>
                                    <EllipsisVertical className="text-muted" />
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu onAction={(key) => {
                                        if (key === "edit") {
                                            handleOpenEditModal(user);
                                        } else if (key === "delete") {
                                            setUserToDelete(user);
                                            setDeleteModalOpen(true);
                                        }
                                    }}>
                                        <Dropdown.Item id="edit" textValue="Edit">
                                            <Label>Edit</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                                            <Trash2 className="w-4 h-4" />
                                            <Label>Delete</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        </div>
                    );
                } else {
                    // Return empty div for non-superadmins (no actions available)
                    return <div></div>;
                }
            default:
                return cellValue;
        }
    }, [currentUser]);

    const onNextPage = React.useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = React.useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const onSearchChange = React.useCallback((value?: string) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = React.useCallback(() => {
        setFilterValue("");
        setPage(1);
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">

                <div className="flex justify-between gap-3 items-end">
                    <FormInput
                        className="w-full sm:max-w-[44%]"
                        placeholder="Search by name or email..."
                        startContent={<Search />}
                        value={filterValue}
                        onValueChange={onSearchChange}
                        onClear={onClear}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
                            <Button variant="secondary" className="hidden sm:flex">
                                Role
                                <ChevronDown className="text-small" />
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    disallowEmptySelection
                                    aria-label="Role Filter"
                                    shouldCloseOnSelect={false}
                                    selectedKeys={roleFilter}
                                    selectionMode="multiple"
                                    onSelectionChange={setRoleFilter}
                                >
                                    {roleOptions.map((role) => (
                                        <Dropdown.Item key={role.uid} id={role.uid} textValue={role.name} className="capitalize">
                                            <Dropdown.ItemIndicator />
                                            <Label>{capitalize(role.name)}</Label>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>

                        {/* Only show Add New User button for superadmins */}
                        {currentUser?.role === 'superadmin' && (
                            <Button
                                variant="primary"
                                onPress={() => setAddUserModalOpen(true)}
                            >
                                Add New User
                            {<Plus />}</Button>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted text-small">Total {users.length} users</span>
                    <label className="flex items-center text-muted text-small">
                        Rows per page:
                        <select
                            className="bg-transparent outline-solid outline-transparent text-muted text-small"
                            onChange={onRowsPerPageChange}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                        </select>
                    </label>
                </div>
            </div>
        );
    }, [currentUser, filterValue, onSearchChange, roleFilter, users.length, onRowsPerPageChange, onClear]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-muted">
                    {filteredItems.length} {filteredItems.length === 1 ? "user" : "users"}
                </span>
                <PageNav page={page} total={pages} onChange={setPage} size="sm" />
                <div className="hidden sm:flex w-[30%] justify-end gap-2">
                    <Button variant="secondary" isDisabled={pages === 1} size="sm" onPress={onPreviousPage}>
                        Previous
                    </Button>
                    <Button variant="secondary" isDisabled={pages === 1} size="sm" onPress={onNextPage}>
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [filteredItems.length, page, pages, onPreviousPage, onNextPage]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Loading users...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {topContent}
                <Table>
                    <Table.ScrollContainer className="max-h-[382px]">
                        <Table.Content
                            aria-label="Admin users table"
                            sortDescriptor={sortDescriptor}
                            onSortChange={setSortDescriptor}
                        >
                            <Table.Header columns={headerColumns}>
                                {(column) => (
                                    <Table.Column
                                        id={column.uid}
                                        isRowHeader={column.uid === "fullName"}
                                        allowsSorting={column.sortable}
                                        className={column.uid === "actions" ? "text-center" : undefined}
                                    >
                                        {({ sortDirection }) => column.sortable ? (
                                            <Table.SortableColumnHeader sortDirection={sortDirection}>{column.name}</Table.SortableColumnHeader>
                                        ) : column.name}
                                    </Table.Column>
                                )}
                            </Table.Header>
                            <Table.Body items={pageItems} renderEmptyState={() => "No users found"}>
                                {(item) => (
                                    <Table.Row id={item.id}>
                                        <Table.Collection items={headerColumns}>
                                            {(column) => <Table.Cell>{renderCell(item, column.uid)}</Table.Cell>}
                                        </Table.Collection>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Content>
                    </Table.ScrollContainer>
                </Table>
                {bottomContent}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal.Backdrop isOpen={deleteModalOpen} onOpenChange={(open) => { if (!open) setDeleteModalOpen(false); }}>
              <Modal.Container size="md">
                <Modal.Dialog>
                    <Modal.Header>
                        <h3 className="text-lg font-semibold text-danger">Confirm Delete User</h3>
                    </Modal.Header>
                    <Modal.Body>
                        {userToDelete && (
                            <div className="space-y-4">
                                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600">ID:</span>
                                            <span className="ml-2 font-semibold">{userToDelete.id}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Name:</span>
                                            <span className="ml-2 font-semibold">{userToDelete.fullName || "No name"}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <span className="ml-2 font-semibold">
                                                {userToDelete.email || "No email"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Role:</span>
                                            <Chip
                                                className="ml-2"
                                                color={roleColorMap[userToDelete.role] || "default"}
                                                size="sm"
                                                variant="soft"
                                            >
                                                {userToDelete.role}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="ghost"
                            onPress={() => setDeleteModalOpen(false)}
                            isDisabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onPress={handleDeleteUser}
                            isPending={isDeleting}
                        >{!isDeleting ? <Trash2 className="w-4 h-4" /> : null}
                            {isDeleting ? "Deleting..." : "Delete User"}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>

            {/* Add User Modal */}
            <Modal.Backdrop isOpen={addUserModalOpen} onOpenChange={(open) => { if (!open) (() => {
                    setAddUserModalOpen(false);
                    setNewUserForm({
                        fullName: '',
                        email: '',
                        password: '',
                        confirmPassword: ''
                    });
                    setFormErrors({});
                })(); }}>
              <Modal.Container size="md">
                <Modal.Dialog>
                    <Modal.Header>
                        <h3 className="text-lg font-semibold text-accent">Add New Admin User</h3>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <FormInput
                                    label="Full Name"
                                    placeholder="Enter full name"
                                    value={newUserForm.fullName}
                                    onValueChange={(value) => handleFormChange('fullName', value)}
                                    isInvalid={!!formErrors.fullName}
                                    errorMessage={formErrors.fullName}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Email"
                                    placeholder="Enter email address"
                                    type="email"
                                    value={newUserForm.email}
                                    onValueChange={(value) => handleFormChange('email', value)}
                                    isInvalid={!!formErrors.email}
                                    errorMessage={formErrors.email}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Password"
                                    placeholder="Enter password"
                                    type="password"
                                    value={newUserForm.password}
                                    onValueChange={(value) => handleFormChange('password', value)}
                                    isInvalid={!!formErrors.password}
                                    errorMessage={formErrors.password}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Confirm Password"
                                    placeholder="Confirm password"
                                    type="password"
                                    value={newUserForm.confirmPassword}
                                    onValueChange={(value) => handleFormChange('confirmPassword', value)}
                                    isInvalid={!!formErrors.confirmPassword}
                                    errorMessage={formErrors.confirmPassword}
                                />
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    <strong>Note:</strong> The new user will be created with <strong>Admin</strong> role and will have access to the admin panel.
                                </p>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="ghost"
                            onPress={() => {
                                setAddUserModalOpen(false);
                                setNewUserForm({
                                    fullName: '',
                                    email: '',
                                    password: '',
                                    confirmPassword: ''
                                });
                                setFormErrors({});
                            }}
                            isDisabled={isCreatingUser}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onPress={handleAddUser}
                            isPending={isCreatingUser}
                        >{!isCreatingUser ? <Plus className="w-4 h-4" /> : null}
                            {isCreatingUser ? "Creating..." : "Create Admin User"}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>

            {/* Edit User Modal */}
            <Modal.Backdrop isOpen={editUserModalOpen} onOpenChange={(open) => { if (!open) (() => {
                    setEditUserModalOpen(false);
                    setEditUserForm({
                        fullName: '',
                        email: '',
                        role: ''
                    });
                    setEditFormErrors({});
                    setUserToEdit(null);
                })(); }}>
              <Modal.Container size="md">
                <Modal.Dialog>
                    <Modal.Header>
                        <h3 className="text-lg font-semibold text-warning">Edit User</h3>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <FormInput
                                    label="Full Name"
                                    placeholder="Enter full name"
                                    value={editUserForm.fullName}
                                    onValueChange={(value) => handleEditFormChange('fullName', value)}
                                    isInvalid={!!editFormErrors.fullName}
                                    errorMessage={editFormErrors.fullName}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Email"
                                    placeholder="Enter email address"
                                    type="email"
                                    value={editUserForm.email}
                                    onValueChange={(value) => handleEditFormChange('email', value)}
                                    isInvalid={!!editFormErrors.email}
                                    errorMessage={editFormErrors.email}
                                />
                            </div>

                            <div>
                                <FormSelect
                                  label="Role"
                                  placeholder="Select user role"
                                  value={editUserForm.role ? editUserForm.role as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        handleEditFormChange('role', selectedKey);
                                    }}
                                  isInvalid={!!editFormErrors.role}
                                  errorMessage={editFormErrors.role}
                                  options={roleOptions.map((role) => ({ value: String(role.uid), label: role.name }))}
                                />
                            </div>

                            {userToEdit && (
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Editing User:</strong> {userToEdit.fullName || "No name"} ({userToEdit.email})
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Current Role: <strong>{userToEdit.role}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="ghost"
                            onPress={() => {
                                setEditUserModalOpen(false);
                                setEditUserForm({
                                    fullName: '',
                                    email: '',
                                    role: ''
                                });
                                setEditFormErrors({});
                                setUserToEdit(null);
                            }}
                            isDisabled={isUpdatingUser}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onPress={handleEditUser}
                            isPending={isUpdatingUser}
                        >
                            {isUpdatingUser ? "Updating..." : "Update User"}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
        </>
    );
}