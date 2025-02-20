USE [VOTE_DCL_2024]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER proc [dbo].[spSelectAllIssuedMember] @RowPerPage int = null, @PageNumber int = null, @SlipStatus varchar(1) = null, @TotalPages INT OUTPUT, @TotalDocuments INT OUTPUT, @OverallDocuments INT OUTPUT, @Tx_org_id varchar(12) = null, @Tx_name varchar(255) = null
as
begin
DECLARE @TotalRows INT
DECLARE @OverallRows INT
SELECT @TotalRows = COUNT(*) from T_MEMBER where (@SlipStatus is null or is_voter_slip = @SlipStatus) and (@Tx_org_id is null or tx_org_id like '%'+@Tx_org_id+'%') and (@Tx_name is null or tx_name like '%'+@Tx_name+'%');
SELECT @OverallRows = COUNT(*) from T_MEMBER;
SET @TotalDocuments = @TotalRows;
SET @OverallDocuments = @OverallRows 
SET @TotalPages = CEILING(CONVERT(DECIMAL(10,2), @TotalRows)/@RowPerPage);

WITH SearchResults AS (
    SELECT *,
           ROW_NUMBER() OVER (order by dtt_voter_slip desc) AS RowNum
    FROM T_MEMBER WHERE (@SlipStatus is null or is_voter_slip = @SlipStatus) and (@Tx_org_id is null or tx_org_id like '%'+@Tx_org_id+'%') and (@Tx_name is null or tx_name like '%'+@Tx_name+'%')
)

SELECT *
FROM SearchResults
WHERE (@SlipStatus is null or is_voter_slip = @SlipStatus) and (@Tx_org_id is null or tx_org_id like '%'+@Tx_org_id+'%') and (@Tx_name is null or tx_name like '%'+@Tx_name+'%') AND RowNum BETWEEN (@PageNumber - 1) * @RowPerPage + 1 AND @PageNumber * @RowPerPage;
end